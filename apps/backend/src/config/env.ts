import { z } from 'zod';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from repo root regardless of cwd
config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_ANON_KEY: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  DAILY_API_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  PORT: z.string().default('3000'),
  SCRAPER_URL: z.string().url().default('http://localhost:8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\n❌ Environment validation failed:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;

export function getAllowedOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}
