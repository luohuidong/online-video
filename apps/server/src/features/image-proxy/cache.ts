import { mkdir } from 'node:fs/promises';

const CACHE_DIR = `${process.cwd()}/.cache/images`;
// Cap on-disk size so a runaway source can't fill the disk. Eviction is
// LRU, computed against the in-memory `entries` map.
const MAX_CACHE_BYTES = 500 * 1024 * 1024; // 500 MiB

// Bun.file / Bun.write don't auto-create parent directories, so ensure the
// cache dir exists before the first write. mkdir({ recursive: true }) is a
// no-op if it already exists.
await mkdir(CACHE_DIR, { recursive: true });

interface CacheEntry {
  size: number;
  // Monotonic counter bumped on every touch. Higher = more recently used.
  // A counter (rather than Date.now()) keeps ordering total even if two
  // reads happen within the same millisecond.
  lastAccess: number;
}

export interface CachedImage {
  hash: string;
  contentType: string;
  buffer: Uint8Array;
}

// Disk-backed image cache.
//
// Layout: `<CACHE_DIR>/<hash>` for the image bytes,
// `<CACHE_DIR>/<hash>.ct` for the Content-Type string.
//
// The in-memory `entries` map mirrors what's on disk so eviction doesn't
// have to stat every file each cycle.
export class ImageCacheService {
  private readonly cacheDir = CACHE_DIR;
  private readonly entries = new Map<string, CacheEntry>();
  private accessCounter = 0;
  private totalBytes = 0;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.scanOnStartup();
  }

  async get(hash: string): Promise<CachedImage | undefined> {
    await this.initPromise;

    const imgPath = `${this.cacheDir}/${hash}`;
    const imgFile = Bun.file(imgPath);
    if (!(await imgFile.exists())) {
      // File vanished (manual delete or evicted in a previous run) — drop
      // the stale entry and report a miss.
      this.entries.delete(hash);
      return undefined;
    }

    const metaFile = Bun.file(`${this.cacheDir}/${hash}.ct`);
    let contentType: string;
    if (await metaFile.exists()) {
      contentType = await metaFile.text();
    } else {
      // Legacy entries written without a meta file assume JPEG.
      contentType = 'image/jpeg';
    }

    const entry = this.entries.get(hash);
    if (entry) {
      entry.lastAccess = ++this.accessCounter;
    }

    const buffer = new Uint8Array(await imgFile.arrayBuffer());
    return { hash, contentType, buffer };
  }

  async set(
    hash: string,
    contentType: string,
    buffer: Uint8Array,
  ): Promise<void> {
    await this.initPromise;

    const imgPath = `${this.cacheDir}/${hash}`;
    const metaPath = `${this.cacheDir}/${hash}.ct`;
    await Bun.write(imgPath, buffer);
    await Bun.write(metaPath, contentType);

    const existing = this.entries.get(hash);
    if (existing) {
      // Replacing an entry with new content — subtract the old size first
      // so `totalBytes` doesn't drift.
      this.totalBytes -= existing.size;
    }
    this.entries.set(hash, {
      size: buffer.byteLength,
      lastAccess: ++this.accessCounter,
    });
    this.totalBytes += buffer.byteLength;

    await this.evictIfNeeded();
  }

  // Rebuild the in-memory index from the directory contents. Existing
  // entries get `lastAccess = 0` so they're treated as the coldest — safe
  // on cold start (we have no signal of which are hot) and real access
  // patterns quickly promote themselves.
  private async scanOnStartup(): Promise<void> {
    const glob = new Bun.Glob('*');
    let scanned = 0;
    for await (const name of glob.scan({ cwd: this.cacheDir })) {
      if (name.endsWith('.ct')) continue;
      let size: number;
      try {
        size = Bun.file(`${this.cacheDir}/${name}`).size;
      } catch {
        continue;
      }
      if (typeof size !== 'number') continue;
      this.entries.set(name, { size, lastAccess: 0 });
      this.totalBytes += size;
      scanned += 1;
    }
    if (scanned > 0) {
      console.log(
        `[image-cache] scanned ${scanned} cached image(s) (~${this.totalBytes} bytes)`,
      );
    }
  }

  private async evictIfNeeded(): Promise<void> {
    if (this.totalBytes <= MAX_CACHE_BYTES) return;

    const sorted = [...this.entries.entries()].sort(
      ([, a], [, b]) => a.lastAccess - b.lastAccess,
    );

    for (const [hash, entry] of sorted) {
      if (this.totalBytes <= MAX_CACHE_BYTES) break;
      await this.removeEntry(hash, entry);
    }
  }

  private async removeEntry(hash: string, entry: CacheEntry): Promise<void> {
    this.entries.delete(hash);
    this.totalBytes -= entry.size;
    // Best-effort cleanup. The .ct meta file may legitimately be missing
    // for legacy entries, and either file may already be gone.
    await Bun.file(`${this.cacheDir}/${hash}`)
      .delete()
      .catch(() => {});
    await Bun.file(`${this.cacheDir}/${hash}.ct`)
      .delete()
      .catch(() => {});
  }
}

export const imageCacheService = new ImageCacheService();
