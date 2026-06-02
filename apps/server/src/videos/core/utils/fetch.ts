const UPSTREAM_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/** 带超时控制的 fetch，超时或网络错误都会抛出异常。 */
export async function timedFetch(url: string, ms: number): Promise<globalThis.Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: UPSTREAM_HEADERS, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e: any) {
    clearTimeout(timer);
    throw new Error(e.message);
  }
}

/** 静默版 JSON 请求——任何错误都返回 null，用于搜索（允许部分源失败）。 */
export async function fetchJson<T = unknown>(url: string, ms = 20000): Promise<T | null> {
  try {
    const res = await timedFetch(url, ms);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** 严格版 JSON 请求——失败时抛出异常，用于详情接口（数据必须成功获取）。 */
export async function fetchJsonOrThrow<T = unknown>(url: string, ms = 20000): Promise<T> {
  const res = await timedFetch(url, ms);
  if (!res.ok) throw new Error(`upstream: ${res.status}`);
  return (await res.json()) as T;
}
