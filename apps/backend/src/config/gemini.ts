import { GoogleGenAI } from '@google/genai';
import { env } from './env';

// FATAL: never log GEMINI_API_KEY. Fail fast at startup if missing.
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
  throw new Error('FATAL: Missing GEMINI_API_KEY — check .env file');
}

export const gemini = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });


