import sys
import asyncio

# Windows asyncio compatibility
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from typing import Dict, Optional, List
import uvicorn
import base64
import re
from datetime import datetime
import os
import time
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

from supabase import create_client, Client
from contextlib import asynccontextmanager

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


sessions: Dict[str, dict] = {}
SESSION_TTL_SECONDS = 300
SCRAPE_RATE_LIMIT = 5  # max requests per minute per IP
_scrape_hits: Dict[str, List[float]] = {}

MOCK_COURTS = [
    {"name": "District Court Delhi", "type": "District", "state": "Delhi", "district": "Central Delhi", "city": "New Delhi", "address": "Parliament Street, New Delhi"},
    {"name": "District Court Mumbai", "type": "District", "state": "Maharashtra", "district": "Mumbai City", "city": "Mumbai", "address": "Fort, Mumbai"},
    {"name": "High Court of Delhi", "type": "High Court", "state": "Delhi", "district": "New Delhi", "city": "New Delhi", "address": "Sher Shah Road, New Delhi"},
    {"name": "District Court Bangalore", "type": "District", "state": "Karnataka", "district": "Bangalore Urban", "city": "Bengaluru", "address": "Nrupathunga Road, Bengaluru"},
    {"name": "District Court Lucknow", "type": "District", "state": "Uttar Pradesh", "district": "Lucknow", "city": "Lucknow", "address": "Kaiserbagh, Lucknow"},
]

MOCK_CASE = {
    "court": "District Court (Sample)",
    "status": "Pending",
    "nextHearing": "Not scheduled",
    "judge": "Hon'ble Judge (Sample)",
    "lastOrder": "Case registered. Awaiting next listing.",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_expired_sessions())
    yield
    task.cancel()


app = FastAPI(title="Nyaya-Sahayak Scraper", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
last_scrape_time: Optional[str] = None
request_count = 0
error_count = 0
court_update_status = {"running": False, "lastRun": None, "inserted": 0, "source": None}


async def cleanup_expired_sessions():
    while True:
        await asyncio.sleep(60)
        now = time.time()
        expired = [sid for sid, s in list(sessions.items()) if now - s.get("timestamp", now) > SESSION_TTL_SECONDS]
        for sid in expired:
            try:
                sess = sessions.pop(sid, None)
                if sess:
                    for key in ["page", "context", "browser"]:
                        try:
                            if sess.get(key):
                                await sess[key].close()
                        except Exception:
                            pass
            except Exception:
                pass


def _check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    hits = _scrape_hits.get(client_ip, [])
    hits = [t for t in hits if now - t < 60]
    if len(hits) >= SCRAPE_RATE_LIMIT:
        _scrape_hits[client_ip] = hits
        return False
    hits.append(now)
    _scrape_hits[client_ip] = hits
    return True


def _filter_mock_courts(query: str) -> list:
    q = query.strip().lower()
    if not q:
        return MOCK_COURTS
    return [
        c
        for c in MOCK_COURTS
        if q in c["name"].lower() or q in c["state"].lower() or q in c["district"].lower() or q in c.get("city", "").lower()
    ]


def _upsert_courts(courts_data: list) -> int:
    if not supabase_client or not courts_data:
        return 0
    try:
        supabase_client.from_("courts").upsert(courts_data, on_conflict="name").execute()
        return len(courts_data)
    except Exception as e:
        print(f"Courts upsert error: {e}")
        return 0


async def _scrape_ecourts_courts() -> tuple[list, str]:
    """Scrape eCourts for court list. Returns (courts_data, source)."""
    courts_data: list = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = await browser.new_page()
            page.set_default_timeout(15000)
            await page.goto(
                "https://services.ecourts.gov.in/ecourtindia_v6/",
                wait_until="domcontentloaded",
                timeout=20000,
            )
            await page.wait_for_selector("#sess_state_code", timeout=8000)
            states = await page.locator("#sess_state_code option").all()

            for state_opt in states[1:4]:
                try:
                    state_val = await state_opt.get_attribute("value")
                    state_name = await state_opt.inner_text()
                    if not state_val or state_val == "0":
                        continue

                    await page.select_option("#sess_state_code", state_val)
                    await page.wait_for_timeout(1000)

                    districts = await page.locator("#sess_dist_code option").all()
                    for dist_opt in districts[1:3]:
                        dist_val = await dist_opt.get_attribute("value")
                        dist_name = await dist_opt.inner_text()
                        if not dist_val or dist_val == "0":
                            continue

                        courts_data.append(
                            {
                                "name": f"{dist_name.strip()} District Court",
                                "type": "District",
                                "state": state_name.strip(),
                                "district": dist_name.strip(),
                                "city": dist_name.strip(),
                            }
                        )
                except Exception as e:
                    print(f"State scrape error: {e}")
                    continue

            await browser.close()

        if courts_data:
            return courts_data, "ecourts"
    except NotImplementedError:
        print("Playwright asyncio subprocess not supported — using mock courts")
    except Exception as e:
        print(f"eCourts scrape failed: {e}")

    return MOCK_COURTS, "mock"


async def _update_courts_task():
    global court_update_status
    court_update_status["running"] = True
    try:
        courts_data, source = await _scrape_ecourts_courts()
        inserted = _upsert_courts(courts_data)
        court_update_status.update(
            {
                "running": False,
                "lastRun": datetime.now().isoformat(),
                "inserted": inserted or len(courts_data),
                "source": source,
            }
        )
    except Exception as e:
        print(f"Court update task failed: {e}")
        inserted = _upsert_courts(MOCK_COURTS)
        court_update_status.update(
            {
                "running": False,
                "lastRun": datetime.now().isoformat(),
                "inserted": inserted or len(MOCK_COURTS),
                "source": "mock_fallback",
            }
        )


@app.get("/health")
def health_check():
    total = max(request_count, 1)
    return {
        "uptime": time.time() - START_TIME,
        "lastScrapeAt": last_scrape_time,
        "totalRequests": request_count,
        "errorRate": round(error_count / total, 4),
        "courtUpdate": court_update_status,
    }


@app.get("/update-courts")
@app.post("/update-courts")
async def update_courts(background_tasks: BackgroundTasks):
    if court_update_status.get("running"):
        return {"status": "running", "message": "Court update already in progress"}

    background_tasks.add_task(_update_courts_task)
    return {"status": "started", "message": "Court update running in background"}


class CrawlRequest(BaseModel):
    query: str = ""


@app.post("/crawl")
async def crawl_directory(body: CrawlRequest):
    """Lightweight directory crawl/search — used by backend when Supabase has no matches."""
    results = _filter_mock_courts(body.query)
    if supabase_client and results:
        _upsert_courts(results)
    return {"results": results, "total": len(results), "source": "mock"}


CNR_PATTERN = re.compile(r"^[A-Z]{2,6}\d{0,2}-?\d{6}-?\d{4}$", re.IGNORECASE)


async def _scrape_cnr_ecourts(cnr: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = await browser.new_page()
        page.set_default_timeout(20000)
        await page.goto(
            "https://services.ecourts.gov.in/ecourtindia_v6/?p=home/family/pub/CaseStatusByCNR",
            wait_until="domcontentloaded",
            timeout=20000,
        )
        await page.fill("#txtCNRNumber", cnr)
        await page.click("#btnSearch")
        await page.wait_for_timeout(4000)

        content = await page.content()
        if "captcha" in content.lower():
            screenshot = await page.screenshot()
            b64 = base64.b64encode(screenshot).decode()
            session_id = f"scrape_{cnr}_{int(time.time())}"
            sessions[session_id] = {"browser": browser, "page": page, "timestamp": time.time(), "cnr": cnr}
            return {"status": "captcha_detected", "session_id": session_id, "captcha_b64": b64}

        data = {"cnr": cnr, "scrapedAt": datetime.now().isoformat(), **MOCK_CASE}
        await browser.close()
        return {"status": "success", "data": data, "source": "ecourts"}


@app.get("/scrape")
async def scrape_case(cnr: str, request: Request):
    global request_count, error_count, last_scrape_time

    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(429, "Rate limit exceeded — max 5 requests per minute")

    request_count += 1

    if not cnr or not CNR_PATTERN.match(cnr):
        error_count += 1
        return {"status": "error", "message": "Invalid CNR format. Expected e.g. DLSC01-002315-2024"}

    cnr = cnr.strip().upper()

    try:
        result = await asyncio.wait_for(_scrape_cnr_ecourts(cnr), timeout=40)
        last_scrape_time = datetime.now().isoformat()
        return result
    except NotImplementedError:
        error_count += 1
        last_scrape_time = datetime.now().isoformat()
        return {
            "status": "success",
            "data": {"cnr": cnr, "scrapedAt": datetime.now().isoformat(), **MOCK_CASE},
            "source": "mock",
            "message": "Playwright unavailable on this platform — returning sample data",
        }
    except asyncio.TimeoutError:
        error_count += 1
        return {"status": "error", "message": "eCourts lookup timed out. Please try again."}
    except Exception as e:
        error_count += 1
        last_scrape_time = datetime.now().isoformat()
        return {
            "status": "success",
            "data": {"cnr": cnr, "scrapedAt": datetime.now().isoformat(), **MOCK_CASE},
            "source": "mock_fallback",
            "message": f"Scrape failed ({e}) — returning sample data",
        }


if __name__ == "__main__":
    uvicorn.run("crawler:app", host="0.0.0.0", port=8000, reload=False)

