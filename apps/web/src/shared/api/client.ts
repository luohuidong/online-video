const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options?: { init?: RequestInit; timeoutMs?: number },
): Promise<T> {
  const { init, timeoutMs = 30000 } = options ?? {};
  const url = `${BASE_URL}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: ctrl.signal,
      ...init,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
