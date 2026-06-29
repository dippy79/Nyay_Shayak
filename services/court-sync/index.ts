import pRetry from 'p-retry';
import { env } from '../../apps/backend/src/config/env.js';

export async function syncCase(cnr: string) {
  const url = `${env.SCRAPER_URL}/lookup?cnr=${encodeURIComponent(cnr)}`;
  return pRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Scraper ${res.status}`);
      return await res.json();
    } finally { clearTimeout(timeout); }
  }, { retries: 3, factor: 2, minTimeout: 1000 });
}

