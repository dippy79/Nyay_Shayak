 import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import type { Database } from "./src/types/supabase.js";

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true
  }));
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Multer memory storage for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // API Routes
  // Enhanced /api/interpret-document with multer and safety check
  app.post("/api/interpret-document", upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageBuffer = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash-exp",
        contents: [
          {
            parts: [
              { 
                text: `
                  STRICT INSTRUCTION: You are an Indian Legal Document Validator FIRST.
                  1. Check if this is a LEGAL DOCUMENT (Challan, Court Summons, Notice, FIR, Bail Order, Warrant).
                  2. If NOT a legal document (receipt, photo, meme, person, landscape, etc.), respond ONLY with:
                    {"error": "NOT_LEGAL_DOC"}
                  3. If it IS a legal document, extract in this EXACT JSON format:
                ` 
              },
              {
                inlineData: {
                  data: imageBuffer,
                  mimeType
                }
              }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              error: { 
                type: Type.STRING, 
                description: "Use ONLY for non-legal documents: 'NOT_LEGAL_DOC'. Otherwise omit." 
              },
              documentType: { type: Type.STRING },
              dateOfNotice: { type: Type.STRING },
              courtAuthority: { type: Type.STRING },
              sections: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              urgency: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.error === 'NOT_LEGAL_DOC') {
        return res.status(400).json({ code: 'NOT_LEGAL_DOC', message: 'Image is not a legal document' });
      }
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      res.status(500).json({ error: "Failed to analyze document. Please try another image." });
    }
  });

// Updated save to legal_documents table with auth
  app.post("/api/save-doc", async (req, res) => {
    const { imageB64, analysis, cnr } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'Authentication required' });

    try {
      const fileName = `legal-doc-${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('legal-documents')
        .upload(fileName, Buffer.from(imageB64, 'base64'), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('legal-documents')
        .getPublicUrl(fileName);

      const { data: dbData, error: dbError } = await supabase
        .from('legal_documents')
        .insert({
          user_id: user.id,
          cnr: cnr || null,
          image_url: publicUrl,
          analysis
        })
        .select()
        .single();

      if (dbError) throw dbError;

      res.json({ 
        success: true, 
        url: publicUrl,
        document: dbData 
      });
    } catch (error: any) {
      console.error("Document Save Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to save document",
        code: 'SAVE_FAILED'
      });
    }
  });

// Case status with 30s timeout + Supabase cache
  app.get("/api/case-status/:cnr", async (req, res) => {
    const { cnr } = req.params;
    const user = req.user; // From auth middleware

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

      // Race scraper vs timeout
      const scraperUrl = process.env.SCRAPER_URL || "http://localhost:8000";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${scraperUrl}/scrape?cnr=${cnr}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Scraper error');

      const data = await response.json();

      // Cache result for 24h
      await supabase.from('case_lookups').upsert({
        cnr,
        status: data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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
          message: "Please try again or check connection"
        }
      });
    }
  });

  // Legal chat with last 10 messages history
  app.post("/api/legal-chat", async (req, res) => {
    const { message, history, lang = 'en' } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Key missing" });

    try {
      const recentHistory = (history || []).slice(-10); // Last 10 messages
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          ...(recentHistory).map((h: any) => ({ 
            role: h.role === 'model' ? 'model' : 'user', 
            parts: [{ text: h.text || h.content }] 
          })),
          { parts: [{ text: `
            You are 'Nyaya-Sahayak', an Indian Legal Assistant. 
            Respond in ${lang === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
            Provide helpful, accurate information about Indian law.
            Include disclaimer: "I am AI, consult a lawyer for legal advice."
            Keep answers concise, simple language.
            Current conversation context: ${recentHistory.length > 0 ? 'ongoing' : 'new'}
            User: ${message}
          ` }] }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.3
        }
      });

      res.json({ 
        text: response.text(),
        usage: response.usageMetadata
      });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Chat service temporarily unavailable" });
    }
  });

  // NEW: Court Directory API with PostGIS distance sorting
  app.get("/api/directory", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 28.6139; // Delhi default
      const lng = parseFloat(req.query.lng as string) || 77.2090;
      const radiusKm = parseInt(req.query.radius as string) || 50;
      
      const { data, error } = await supabase.rpc('find_nearby_courts', {
        lat_point: lat,
        lng_point: lng,
        radius: radiusKm
      });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Directory Error:', error);
      res.status(500).json({ error: 'Failed to fetch directory' });
    }
  });

  // NEW: Supabase Phone Auth endpoints
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ error: 'Phone required' });

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone.replace(/^\+91/, '')}`,
        options: { channel: 'sms' }
      });

      if (error) throw error;
      res.json({ success: true, message: 'OTP sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/confirm", async (req, res) => {
    try {
      const { phone, token } = req.body;
      if (!phone || !token) return res.status(400).json({ error: 'Phone and token required' });

      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/^\+91/, '')}`,
        token,
        type: 'sms'
      });

      if (error) throw error;
      res.json({ 
        user: data.user,
        session: data.session 
      });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
