from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from typing import Dict, Optional
import uvicorn
import asyncio
import base64
import re
from datetime import datetime
import os
import time
from dotenv import load_dotenv


load_dotenv()

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_expired_sessions())
    yield
    task.cancel()

app = FastAPI(title="Nyaya-Sahayak Scraper", version="1.0.0", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global session storage for captcha handling
sessions: Dict[str, dict] = {}

SESSION_TTL_SECONDS = 300  # 5 minutes

async def cleanup_expired_sessions():
    while True:
        await asyncio.sleep(60)
        now = time.time()
        expired = [
            sid for sid, s in list(sessions.items())
            if now - s.get('timestamp', now) > SESSION_TTL_SECONDS
        ]
        for sid in expired:
            try:
                sess = sessions.pop(sid, None)
                if sess:
                    try:
                        if sess.get('page'):
                            await sess['page'].close()
                    except Exception:
                        pass
                    try:
                        if sess.get('context'):
                            await sess['context'].close()
                    except Exception:
                        pass
                    try:
                        if sess.get('browser'):
                            await sess['browser'].close()
                    except Exception:
                        pass
                    print(f"[GC] Expired session {sid} cleaned up")
            except Exception as e:
                print(f"[GC] Error cleaning session {sid}: {e}")


# PHASE 4: scraper health counters
START_TIME = time.time()
last_scrape_time = None
request_count = 0
error_count = 0

@app.get("/health")
def health_check():
    """Scraper health endpoint for admin polling."""
    total = max(request_count, 1)
    return {
        "uptime": time.time() - START_TIME,
        "lastScrapeAt": last_scrape_time,
        "totalRequests": request_count,
        "errorRate": round(error_count / total, 4),
    }


CNR_PATTERN = re.compile(r'^[A-Z]{2,6}\d{0,2}-?\d{6}-?\d{4}$', re.IGNORECASE)

@app.get("/scrape")
async def scrape_case(cnr: str):
    """Main case scrape endpoint - detects captcha, pauses for solve"""
    global request_count, error_count, last_scrape_time

    request_count += 1

    if not cnr or not CNR_PATTERN.match(cnr):

        error_count += 1
        return {
            "status": "error",
            "message": "Invalid CNR format",
            "cnr": cnr,
        }


    session_id = f"scrape_{cnr}_{int(datetime.now().timestamp())}"
    
    try:
        async with async_playwright() as p:


            browser = await p.chromium.launch(headless=False, slow_mo=500)  # Visible for captcha
            context = await browser.new_context()
            page = await context.new_page()
            
            await page.goto("https://services.ecourts.gov.in/ecourtindia_v6/?p=home/family/pub/CaseStatusByCNR&app_token=null", wait_until="networkidle")
            
            # Fill CNR
            await page.fill('#txtCNRNumber', cnr)
            await page.click('#btnSearch')
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            # Check for captcha
            captcha_detected = await page.locator('#captcha_img, [alt*="captcha"], .captcha-image').count() > 0 or \
                              'captcha' in (await page.content()).lower()
            
            if captcha_detected:
                # Take screenshot base64
                screenshot_bytes = await page.screenshot(full_page=False)
                screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
                
                # Store session
                sessions[session_id] = {
                    'browser': browser,
                    'context': context,
                    'page': page,
                    'cnr': cnr,
                    'screenshot': screenshot_b64,
                    'timestamp': time.time()
                }

                
                return {
                    'status': 'captcha_detected',
                    'session_id': session_id,
                    'captcha_b64': screenshot_b64,
                    'message': 'Captcha detected. POST /solve-captcha/{session_id} with solution.'
                }
            
            # No captcha - extract data
            data = await extract_case_data(page)
            await browser.close()
            
            return {
                'status': 'success',
                'data': data
            }
            
    except asyncio.TimeoutError:
        error_count += 1
        return {'status': 'timeout', 'error': 'Page load timeout', 'session_id': session_id}
    except Exception as e:
        error_count += 1
        return {
            'status': 'error',
            'error': str(e),
            'session_id': session_id if session_id in locals() else None
        }



@app.post("/solve-captcha/{session_id}")
async def solve_captcha(session_id: str, captcha_solution: str):
    """Resume scraping after captcha solve"""
    global request_count, error_count, last_scrape_time
    request_count += 1
    last_scrape_time = datetime.now().isoformat()

    if session_id not in sessions:
        error_count += 1
        raise HTTPException(status_code=404, detail="Session not found or expired")


    
    session = sessions[session_id]
    page = session['page']
    
    try:
        # Solve captcha (adjust selectors for actual eCourts captcha)
        await page.fill('input[name*="captcha"], #captcha, .captcha-input', captcha_solution)

        await page.click('input[type="submit"], button[type="submit"], #btnSubmit')
        await page.wait_for_load_state('networkidle', timeout=10000)
        
        # Extract case data
        data = await extract_case_data(page)
        
        # Cleanup
        await session['browser'].close()
        del sessions[session_id]
        
        return {
            'status': 'success',
            'data': data
        }
        
    except Exception as e:
        error_count += 1

        last_scrape_time = datetime.now().isoformat()
        return {
            'status': 'solve_failed',
            'error': str(e)
        }


async def extract_case_data(page):
    """Extract structured case data using common eCourts selectors"""
    selectors = {
        'case_no': '.caseDetailHeader, .case-no, h2, #caseNumber, td:contains("Case") + td',
        'status': '.status, .case-status, td:contains("Status") + td',
        'next_hearing': '.next-listing, .hearing-date, td:contains("Next") + td',
        'court': '.court-name, td:contains("Court") + td',
        'judge': '.judge-name, td:contains("Judge") + td',
        'last_order': '.order-details, .last-order, .listing-order-details'
    }
    
    data = {}
    for key, selector in selectors.items():
        try:
            elements = await page.locator(selector).all()
            text = await elements[0].inner_text() if elements else 'N/A'
            data[key.replace('_', ' ').title()] = text.strip()
        except:
            data[key.replace('_', ' ').title()] = 'N/A'
    
    data['scrapedAt'] = datetime.now().isoformat()
    return data

@app.delete("/session/{session_id}")
async def close_session(session_id: str):
    """Cleanup browser session"""
    if session_id in sessions:
        try:
            await sessions[session_id]['browser'].close()
        except:
            pass
        del sessions[session_id]
        return {"status": "closed"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/sessions")
async def list_sessions():
    """List active sessions for monitoring"""
    active = []
    for sid, sess in sessions.items():
        active.append({
            'id': sid,
            'cnr': sess['cnr'],
            'timestamp': sess['timestamp'],
            'age_minutes': (datetime.now() - datetime.fromisoformat(sess['timestamp'])).total_seconds() / 60
        })
    return {'active_sessions': active}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
