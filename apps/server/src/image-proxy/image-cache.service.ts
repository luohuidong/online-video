import {
  access,
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, OnModuleInit } from '@nestjs/common';

const CACHE_DIR = join(process.cwd(), '.cache', 'images');
// Cap on-disk size so a runaway source can't fill the disk. Eviction is
// LRU, computed against the in-memory `entries` map.
const MAX_CACHE_BYTES = 500 * 1024 * 1024; // 500 MiB

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
  buffer: Buffer;
}

// Disk-backed image cache.
//
// Layout: `<CACHE_DIR>/<hash>` for the image bytes,
// `<CACHE_DIR>/<hash>.ct` for the Content-Type string.
//
// The in-memory `entries` map mirrors what's on disk so eviction doesn't
// have to stat every file each cycle.
@Injectable()
export class ImageCacheService implements OnModuleInit {
  private readonly cacheDir = CACHE_DIR;
  private readonly entries = new Map<string, CacheEntry>();
  private accessCounter = 0;
  private totalBytes = 0;

  // Runs before HTTP listeners accept traffic (Nest waits on this), so the
  // first request always sees the correct size accounting.
  async onModuleInit(): Promise<void> {
    await this.scanOnStartup();
  }

  async get(hash: string): Promise<CachedImage | undefined> {
    const imgPath = join(this.cacheDir, hash);
    try {
      await access(imgPath);
    } catch {
      // File vanished (manual delete or evicted in a previous run) — drop
      // the stale entry and report a miss.
      this.entries.delete(hash);
      return undefined;
    }

    let contentType: string;
    try {
      contentType = await readFile(join(this.cacheDir, `${hash}.ct`), 'utf8');
    } catch {
      // Legacy entries written without a meta file assume JPEG.
      contentType = 'image/jpeg';
    }

    const entry = this.entries.get(hash);
    if (entry) {
      entry.lastAccess = ++this.accessCounter;
    }

    const buffer = await readFile(imgPath);
    return { hash, contentType, buffer };
  }

  async set(hash: string, contentType: string, buffer: Buffer): Promise<void> {
    const imgPath = join(this.cacheDir, hash);
    const metaPath = join(this.cacheDir, `${hash}.ct`);
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(imgPath, buffer);
    await writeFile(metaPath, contentType);

    const existing = this.entries.get(hash);
    if (existing) {
      // Replacing an entry with new content — subtract the old size first
      // so `totalBytes` doesn't drift.
      this.totalBytes -= existing.size;
    }
    this.entries.set(hash, {
      size: buffer.length,
      lastAccess: ++this.accessCounter,
    });
    this.totalBytes += buffer.length;

    await this.evictIfNeeded();
  }

  // Rebuild the in-memory index from the directory contents. Existing
  // entries get `lastAccess = 0` so they're treated as the coldest — safe
  // on cold start (we have no signal of which are hot) and real access
  // patterns quickly promote themselves.
  private async scanOnStartup(): Promise<void> {
    let names: string[];
    try {
      names = await readdir(this.cacheDir);
    } catch {
      return; // cache directory doesn't exist yet
    }

    await Promise.all(
      names
        .filter((name) => !name.endsWith('.ct'))
        .map(async (name) => {
          try {
            const fileStat = await stat(join(this.cacheDir, name));
            this.entries.set(name, { size: fileStat.size, lastAccess: 0 });
            this.totalBytes += fileStat.size;
          } catch {
            // skip unreadable entries
          }
        }),
    );
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
    await unlink(join(this.cacheDir, hash)).catch(() => {});
    await unlink(join(this.cacheDir, `${hash}.ct`)).catch(() => {});
  }
}
