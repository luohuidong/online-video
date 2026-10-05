import { type CachedImage, imageCacheService } from './cache';
import { fetchImage } from './fetcher';

// Orchestration: hash the URL → try the cache → otherwise fetch + cache.
//
// `inflight` collapses concurrent misses on the same URL into a single
// upstream fetch. The promise is registered before the network call and
// removed in `finally`, so concurrent requesters share one round-trip and
// there's no leak if the fetcher throws.
export class ImageProxyService {
  private readonly inflight = new Map<string, Promise<CachedImage>>();

  async proxy(url: string): Promise<CachedImage> {
    const hash = new Bun.CryptoHasher('sha256').update(url).digest('hex');

    const cached = await imageCacheService.get(hash);
    if (cached) return cached;

    const existing = this.inflight.get(hash);
    if (existing) return existing;

    const promise = this.fetchAndCache(hash, url).finally(() => {
      this.inflight.delete(hash);
    });
    this.inflight.set(hash, promise);
    return promise;
  }

  private async fetchAndCache(hash: string, url: string): Promise<CachedImage> {
    const fetched = await fetchImage(url);
    await imageCacheService.set(hash, fetched.contentType, fetched.buffer);
    return { hash, ...fetched };
  }
}

export const imageProxyService = new ImageProxyService();
