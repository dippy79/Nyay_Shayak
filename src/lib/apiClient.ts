interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));

        // Do not retry client errors
        if (res.status >= 400 && res.status < 500) {
          throw Object.assign(new Error((err as any).message || 'Client error'), {
            status: res.status,
            body: err,
          });
        }

        throw Object.assign(new Error((err as any).message || 'Server error'), {
          status: res.status,
        });
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err as Error;

      const status = (err as any).status;
      if (status && status >= 400 && status < 500) throw err;

      if (attempt < retries) {
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError!;
}

