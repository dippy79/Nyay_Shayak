import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, getAllowedOrigins } from './config/env.js';
import { supabase } from './config/supabase.js';
import { verifyJWT } from './middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './lib/logger.js';
import { sanitizeGeminiHistory, type ChatHistoryItem } from './lib/gemini.js';
import { isValidCNR, normalizeCNR } from './lib/validation.js';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function startServer() {
  const app = express();

  app.use(cors({ origin: getAllowedOrigins() }));
  app.use(express.json({ limit: '2mb' }));

  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many AI requests, try again later' },
  });

  const scrapeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Too many scrape requests, try again later' },
  });

  // ===== HEALTH =====
  app.get('/api/health', async (_req, res) => {
    let supabaseOk = false;
    let courtsCount: number | null = null;

    try {
      const { count, error } = await supabase
        .from('courts')
        .select('*', { count: 'exact', head: true });
      supabaseOk = !error;
      courtsCount = count;
    } catch (err) {
      logger.error('HEALTH', 'Supabase ping failed', errorMessage(err));
    }

    let scraperOk = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const scraperRes = await fetch(`${env.SCRAPER_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      scraperOk = scraperRes.ok;
    } catch {
      scraperOk = false;
    }

    const ok = supabaseOk;
    res.status(ok ? 200 : 503).json({
      ok,
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseOk,
        gemini: !!env.GEMINI_API_KEY,
        scraper: scraperOk,
        vapid: !!env.VAPID_PUBLIC_KEY,
      },
      courtsCount,
    });
  });

  // ===== DIRECTORY - SUPABASE SEARCH =====
  app.get('/api/directory', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const type = String(req.query.type || 'all');
      const state = String(req.query.state || '').trim();
      const district = String(req.query.district || '').trim();

      let query = supabase.from('courts').select('*');

      if (q) {
        // Search columns that exist in schema (city added via migration; district covers city-like queries)
        query = query.or(
          `name.ilike.%${q}%,district.ilike.%${q}%,state.ilike.%${q}%,address.ilike.%${q}%`,
        );
      }

      if (state) query = query.ilike('state', `%${state}%`);
      if (district) query = query.ilike('district', `%${district}%`);
      if (type !== 'all') query = query.eq('type', type);

      const { data, error } = await query.limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        try {
          await fetch(`${env.SCRAPER_URL}/crawl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q }),
          });
        } catch {
          // non-critical; ignore crawl trigger failures
        }
      }



      res.json({
        results: data ?? [],
        total: data?.length ?? 0,
        source: 'supabase',
      });
    } catch (error) {
      logger.error('DIRECTORY', errorMessage(error), error);
      res.status(500).json({ error: 'Search failed', details: errorMessage(error) });
    }
  });

  // ===== LEGAL CHAT - GEMINI =====
  app.post('/api/legal-chat', aiLimiter, async (req, res) => {
    try {
      const { message, history = [], provider = 'gemini' } = req.body as {
        message?: string;
        history?: ChatHistoryItem[];
        provider?: string;
      };

      if (!message?.trim()) {
        return res.status(400).json({ error: 'Message required' });
      }

      const systemPrompt = `You are Legis, an expert AI legal assistant for Indian law. Provide accurate, helpful guidance on IPC, CrPC, CPC, Constitution, and legal procedures. Always:
1. Give practical, actionable advice
2. Cite relevant sections when possible
3. Clarify you are not a lawyer
4. Recommend consulting a lawyer for specific cases
5. Respond in user's language (Hindi/English)`;

      let reply = '';

      if (provider === 'meta' && env.GEMINI_API_KEY) {
        const response = await fetch('https://api.meta.ai/v1/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'muse-spark',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
              { role: 'user', content: message },
            ],
          }),
        });
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        reply = data.choices?.[0]?.message?.content || 'Meta AI unavailable';
      } else if (env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: systemPrompt,
        });

        const sanitizedHistory = sanitizeGeminiHistory(history);
        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessage(message);
        reply = result.response.text();
      } else {
        return res.status(503).json({
          error: 'AI service not configured. Add GEMINI_API_KEY to .env',
        });
      }

      try {
        await supabase.from('chat_logs').insert({
          message,
          reply,
          provider,
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        logger.warn('CHAT', 'Failed to log chat (non-fatal)', errorMessage(logErr));
      }

      res.json({ reply, text: reply, provider, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('CHAT', errorMessage(error), error);
      res.status(500).json({ error: 'AI service error', details: errorMessage(error) });
    }
  });

  // ===== CASE STATUS (CNR lookup via scraper) =====
  app.get('/api/case-status/:cnr', scrapeLimiter, async (req, res) => {
    try {
      const cnr = normalizeCNR(req.params.cnr || '');

      if (!isValidCNR(cnr)) {
        return res.status(400).json({
          error: 'Invalid CNR format',
          details: 'Expected format like DLSC01-002315-2024',
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      let scraperRes: Response;
      try {
        scraperRes = await fetch(
          `${env.SCRAPER_URL}/scrape?cnr=${encodeURIComponent(cnr)}`,
          { signal: controller.signal },
        );
      } finally {
        clearTimeout(timeout);
      }

      const payload = await scraperRes.json() as Record<string, unknown>;

      if (!scraperRes.ok) {
        return res.status(scraperRes.status).json({
          error: 'Scraper error',
          details: payload.message ?? payload.error ?? 'Unknown scraper error',
        });
      }

      if (payload.status === 'error') {
        return res.status(422).json({ error: payload.message ?? payload.error ?? 'Lookup failed' });
      }

      if (payload.status === 'captcha_detected') {
        return res.status(202).json({
          status: 'captcha_required',
          sessionId: payload.session_id,
          captchaB64: payload.captcha_b64,
        });
      }

      const data = (payload.data ?? {}) as Record<string, string>;
      res.json({
        caseNo: data.cnr ?? cnr,
        court: data.court ?? 'District Court',
        status: data.status ?? 'Pending',
        nextHearing: data.nextHearing ?? 'Not scheduled',
        judge: data.judge ?? '—',
        lastOrder: data.lastOrder ?? 'No orders on record',
        source: payload.source ?? 'ecourts',
      });
    } catch (error) {
      logger.error('CASE-STATUS', errorMessage(error), error);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      res.status(isTimeout ? 504 : 500).json({
        error: isTimeout ? 'Case lookup timed out' : 'Case lookup failed',
        details: errorMessage(error),
      });
    }
  });

  // ===== SCRAPER STATUS =====
  app.get('/api/scraper-status', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const scraperRes = await fetch(`${env.SCRAPER_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!scraperRes.ok) {
        return res.json({ status: 'offline', lastRun: null, casesProcessed: 0 });
      }

      const data = await scraperRes.json() as Record<string, unknown>;
      res.json({
        status: 'active',
        lastRun: data.lastScrapeAt ?? null,
        casesProcessed: data.totalRequests ?? 0,
        errorRate: data.errorRate ?? 0,
        uptime: data.uptime ?? 0,
      });
    } catch {
      res.json({ status: 'offline', lastRun: null, casesProcessed: 0 });
    }
  });

  // ===== COURT UPDATES =====
  app.get('/api/court-updates/:courtId', async (req, res) => {
    try {
      const { courtId } = req.params;
      const { data, error } = await supabase
        .from('court_updates')
        .select('*')
        .eq('court_id', courtId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      res.json({ updates: data ?? [] });
    } catch (error) {
      logger.error('COURT-UPDATES', errorMessage(error));
      res.status(500).json({ error: 'Failed to fetch updates', details: errorMessage(error) });
    }
  });

  // ===== LAWYERS =====
  app.get('/api/lawyers', async (req, res) => {
    try {
      const { specialization, city, page = '1' } = req.query;
      let query = supabase.from('lawyers').select('*');

      if (specialization) query = query.eq('specialization', specialization);
      if (city) query = query.ilike('city', `%${city}%`);

      const pageNum = Math.max(1, Number(page));
      const { data, error } = await query.range((pageNum - 1) * 20, pageNum * 20 - 1);

      if (error) {
        const isMissingTable = error.message?.includes('schema cache') ||
          error.message?.includes('does not exist') ||
          (error as any).code === 'PGRST204';

        if (isMissingTable) {
          return res.status(503).json({
            error: 'Lawyers data unavailable',
            reason: 'Database migration pending',
            action: 'Run supabase/MANUAL_FIX.sql in Supabase dashboard',
            data: [],
          });
        }

        return res.status(500).json({
          error: 'Failed to fetch lawyers',
          details: error.message,
        });
      }

      res.json({ lawyers: data ?? [] });
    } catch (error) {
      const details = (error as any)?.message ?? JSON.stringify(error);
      logger.error('LAWYERS', errorMessage(error), { details });
      res.status(500).json({ error: 'Failed to fetch lawyers', details });
    }
  });

  // ===== PUSH NOTIFICATIONS =====
  app.post('/api/push/subscribe', verifyJWT, async (req, res) => {
    try {
      const { subscription } = req.body;
      const userId = (req as express.Request & { user?: { id: string } }).user?.id || req.body.user_id;

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ user_id: userId, subscription, updated_at: new Date() });

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logger.error('PUSH', errorMessage(error));
      res.status(500).json({ error: 'Subscription failed', details: errorMessage(error) });
    }
  });

  // ===== PAYMENTS =====
  app.post('/api/payments/create-order', verifyJWT, async (req, res) => {
    try {
      const { amount } = req.body;
      const order = {
        id: `order_${Date.now()}`,
        amount: Number(amount) * 100,
        currency: 'INR',
      };
      res.json({ order });
    } catch (error) {
      logger.error('PAYMENTS', errorMessage(error));
      res.status(500).json({ error: 'Payment failed', details: errorMessage(error) });
    }
  });

  // TEMPORARY — payments disabled, testing mode only
  app.post('/api/payments/verify', verifyJWT, (_req, res) => {
    res.status(503).json({
      error: 'Payment verification not yet enabled.',
      mode: 'testing',
    });
  });


  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const e = err as { status?: number; publicMessage?: string; code?: string; message?: string };
    logger.error('ERROR', e.publicMessage ?? e.message ?? 'Internal Error', err);
    res.status(e.status ?? 500).json({
      error: e.publicMessage ?? e.message ?? 'Internal Error',
      code: e.code ?? 'INTERNAL',
    });
  });

  const port = Number(env.PORT || 3000);
  app.listen(port, () => {
    logger.info('SERVER', `Legis backend running on port ${port}`);
    logger.info('SERVER', `Supabase: ${env.SUPABASE_URL ? 'configured' : 'missing'}`);
    logger.info('SERVER', `Gemini: ${env.GEMINI_API_KEY ? 'ready' : 'missing'}`);
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
