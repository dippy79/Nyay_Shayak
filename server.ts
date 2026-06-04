import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string; phone?: string };
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  } as any);
  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan('dev'));

  // Auth middleware (Supabase JWT)
  // PHASE 1: ensures req.user exists for protected endpoints.
  // Reads Authorization: Bearer <token>
  // Uses supabase.auth.getUser(token)
  // Attaches req.user = { id, email, phone }
  const verifySupabaseJWT: express.RequestHandler = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

      req.user = {
        id: user.id,
        email: user.email ?? undefined,
        phone: (user as any).phone ?? undefined,
      };

      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // API Routes
  // PHASE 2: JSON payload scanner (auth protected)
  app.post("/api/interpret-document", verifySupabaseJWT, async (req, res) => {
    const { z } = ({} as { z?: any });

    // Input validation (zero-trust style without adding new deps)
    const parsedBody = req.body as { image?: unknown; mimeType?: unknown };
    const image = typeof parsedBody?.image === 'string' ? parsedBody.image : undefined;
    const mimeType = typeof parsedBody?.mimeType === 'string' ? parsedBody.mimeType : undefined;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'image is required' });
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const mime = (mimeType || 'image/jpeg').toLowerCase();
    if (!ALLOWED_TYPES.includes(mime)) {
      return res.status(400).json({ error: 'INVALID_MIME', message: 'Only JPEG, PNG, WebP allowed' });
    }

    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(image, 'base64');
      if (imageBuffer.length < 100) throw new Error('Too small');
    } catch {
      return res.status(400).json({ error: 'INVALID_BASE64', message: 'Image data is corrupted' });
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    if (imageBuffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Image must be under 5MB' });
    }


    // Robust parsing: find the first {...} block and parse
    const jsonBlockFromText = (text: string) => {
      const match = text.match(/\{[\s\S]*\}/);
      return match?.[0] ?? null;
    };

    const validateAiJson = (rawText: string) => {
      const block = jsonBlockFromText(rawText);
      if (!block) return { ok: false };

      try {
        const parsed = JSON.parse(block) as any;

        if (parsed?.error === 'NOT_LEGAL_DOC') return { ok: true, success: true, data: { error: 'NOT_LEGAL_DOC' } };

        const allowedUrgency = new Set(['High', 'Medium', 'Low']);
        const isValid =
          typeof parsed?.documentType === 'string' &&
          typeof parsed?.dateOfNotice === 'string' &&
          typeof parsed?.courtAuthority === 'string' &&
          Array.isArray(parsed?.sections) && parsed.sections.every((x: any) => typeof x === 'string') &&
          typeof parsed?.summary === 'string' &&
          Array.isArray(parsed?.nextSteps) && parsed.nextSteps.every((x: any) => typeof x === 'string') &&
          typeof parsed?.urgency === 'string' && allowedUrgency.has(parsed.urgency);

        if (!isValid) return { ok: false };
        return { ok: true, success: true, data: parsed };
      } catch {
        return { ok: false };
      }
    };


    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const systemPrompt = `
      STRICT INSTRUCTION: You are an Indian Legal Document Validator FIRST.
      1. Check if this is a LEGAL DOCUMENT (Challan, Court Summons, Notice, FIR, Bail Order, Warrant).
      2. If NOT a legal document (receipt, photo, meme, person, landscape, etc.), respond ONLY with:
        {"error": "NOT_LEGAL_DOC"}
      3. If it IS a legal document, extract in this EXACT JSON format:
      {
        "documentType": string,
        "dateOfNotice": string,
        "courtAuthority": string,
        "sections": string[],
        "summary": string,
        "nextSteps": string[],
        "urgency": "High" | "Medium" | "Low"
      }
    `;

    const aiCallWithTimeout = async (fn: () => Promise<any>, ms = 25_000) => {
      return Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)),
      ]);
    };

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await aiCallWithTimeout(() =>
        ai.models.generateContent({
          model: 'gemini-1.5-flash-exp',
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: image,
                  },
                },
                { text: systemPrompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        }),
      );

      const rawText = typeof response.text === 'string' ? response.text : '';
      const validated = validateAiJson(rawText);

      if (!validated) {
        return res.status(500).json({ code: 'AI_SCHEMA_MISMATCH', error: 'AI output schema mismatch' });
      }

      if (!validated.success) {
        return res.status(500).json({ code: 'AI_SCHEMA_MISMATCH', error: 'AI output schema mismatch' });
      }

      const result = validated.data;

      if ('error' in result && result.error === 'NOT_LEGAL_DOC') {
        return res.status(400).json({ code: 'NOT_LEGAL_DOC', message: 'Image is not a legal document' });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Gemini Vision Error:', error);
      const code = error?.message === 'AI_TIMEOUT' ? 'AI_TIMEOUT' : 'AI_ERROR';
      return res.status(500).json({ code, error: 'Failed to analyze document. Please try another image.' });
    }
  });


  // PHASE 2: save-doc JSON payload (auth protected)
  app.post("/api/save-doc", verifySupabaseJWT, async (req, res) => {
    const { image, mimeType, analysis, cnr } = req.body as {
      image?: string;
      mimeType?: string;
      analysis: unknown;
      cnr?: string;
    };

    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (!image) return res.status(400).json({ error: 'No image provided' });

    try {
      const fileName = `legal-doc-${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('legal-documents')
        .upload(fileName, Buffer.from(image, 'base64'), {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('legal-documents')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      const { data: dbData, error: dbError } = await supabase
        .from('legal_documents')
        .insert({
          user_id: user.id,
          cnr: cnr || null,
          image_url: publicUrl,
          analysis,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      res.json({
        success: true,
        url: publicUrl,
        document: dbData,
      });
    } catch (error: any) {
      console.error("Document Save Error:", error);
      res.status(500).json({
        error: error.message || "Failed to save document",
        code: 'SAVE_FAILED',
      });
    }
  });

  // Case status with 30s timeout + Supabase cache (public)
  app.get("/api/case-status/:cnr", async (req, res) => {

    const { cnr } = req.params;
    try {
      // Check cache first
      const { data: cached } = await supabase
        .from('case_lookups')
        .select('*')
        .eq('cnr', cnr)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        return res.json(cached.status);
      }

      const scraperUrl = process.env.SCRAPER_URL || "http://localhost:8000";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${scraperUrl}/scrape?cnr=${cnr}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Scraper error');

      const data = await response.json();

      await supabase.from('case_lookups').upsert({
        cnr,
        status: data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      res.json(data);
    } catch (error: any) {
      console.error("Case Status Error:", error);
      res.status(500).json({
        error: 'Case lookup failed',
        fallback: {
          caseNo: cnr,
          status: "Lookup failed",
          nextHearing: "N/A",
          court: "eCourts India",
          message: "Please try again or check connection",
        },
      });
    }
  });

  // PHASE 2 - Legal chat with last 10 messages history (public)
  app.post("/api/legal-chat", async (req, res) => {
    const { message, history, lang = 'en' } = req.body as {
      message: string;
      history?: any[];
      lang?: 'en' | 'hi';
    };

    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Key missing" });

    try {
      const recentHistory = (history || []).slice(-10);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          ...(recentHistory).map((h: any) => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text || h.content }],
          })),
          {
            parts: [
              {
                text: `
                  You are 'Nyaya-Sahayak', an Indian Legal Assistant.
                  Respond in ${lang === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
                  Provide helpful, accurate information about Indian law.
                  Include disclaimer: "I am AI, consult a lawyer for legal advice."
                  Keep answers concise, simple language.
                  Current conversation context: ${recentHistory.length > 0 ? 'ongoing' : 'new'}
                  User: ${message}
                `,
              },
            ],
          },
        ],
        config: {
          maxOutputTokens: 500,
          temperature: 0.3,
        },
      });

      res.json({
        text: response.text || '',
        usage: response.usageMetadata,
      });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Chat service temporarily unavailable" });
    }
  });

  // PHASE 3: Directory API alignment (public)
  app.get("/api/directory", async (req, res) => {
    try {
      const { q, lat, lng, radius = 10000 } = req.query as {
        q?: string;
        lat?: string;
        lng?: string;
        radius?: string | number;
      };

      if (lat && lng) {
        const { data, error } = await supabase.rpc('find_nearby_courts', {
          lat_point: +lat,
          lng_point: +lng,
          radius: +radius,
        });
        if (error) throw error;
        const rows = (data || []) as any[];
        return res.status(200).json(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            address: r.address,
            district: r.district,
            lat: r.lat,
            lng: r.lng,
            phone: r.phone ?? undefined,
          }))
        );
      }

      if (q) {
        const { data, error } = await supabase
          .from('legal_directory')
          .select('*')
          .or(`name.ilike.%${q}%,address.ilike.%${q}%,district.ilike.%${q}%`)
          .limit(20);

        if (error) throw error;

        const rows = (data || []) as any[];
        return res.status(200).json(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            address: r.address,
            district: r.district,
            lat: r.lat,
            lng: r.lng,
            phone: r.phone ?? undefined,
          }))
        );
      }

      const { data, error } = await supabase.from('legal_directory').select('*').limit(20);
      if (error) throw error;

      const rows = (data || []) as any[];
      return res.status(200).json(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          address: r.address,
          district: r.district,
          lat: r.lat,
          lng: r.lng,
          phone: r.phone ?? undefined,
        }))
      );
    } catch (error) {
      console.error('Directory Error:', error);
      return res.status(200).json([]);
    }
  });

  // NEW: /api/scraper-status (public)
  app.get('/api/scraper-status', async (req, res) => {
    try {
      const r = await fetch(`${process.env.SCRAPER_URL || 'http://localhost:8000'}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = (await r.json()) as Record<string, unknown>;
      res.json({ status: 'online', ...data });
    } catch {
      res.json({ status: 'offline', uptime: 0, lastScrapeAt: null, totalRequests: 0, errorRate: 0 });
    }
  });

  // Supabase Phone Auth endpoints (public)
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { phone } = req.body as { phone?: string };
      if (!phone) return res.status(400).json({ error: 'Phone required' });

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone.replace(/^\+91/, '')}`,
        options: { channel: 'sms' },
      });

      if (error) throw error;
      res.json({ success: true, message: 'OTP sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/confirm", async (req, res) => {
    try {
      const { phone, token } = req.body as { phone?: string; token?: string };
      if (!phone || !token) return res.status(400).json({ error: 'Phone and token required' });

      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/^\+91/, '')}`,
        token,
        type: 'sms',
      });

      if (error) throw error;
      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.info(`[Legis] Server running on http://localhost:${PORT}`);
  });

}

startServer();

