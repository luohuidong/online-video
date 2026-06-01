# Server-side in-memory m3u8 proxy with session-scoped prefetch

**Date:** 2026-06-01
**Status:** Draft (pending user review)
**Scope:** Phase 0 design spec — implementation follows in a separate pass after approval.

---

## Context

Today, when a user opens a video episode in the web app, the browser fetches the m3u8 playlist and every `.ts` / `.m4s` segment **directly from the upstream 苹果CMS CDN** — the NestJS server has no involvement in playback. When the upstream CDN is slow or geographically distant, the user sees slow initial buffering and occasional mid-playback stalls.

The user has a personal/family-use deployment and a concrete coping pattern: **pause the video, wait for it to fully load, then watch.** The goal of this feature is to make that pattern obsolete by moving the buffering work onto the server, where it can run in memory and serve subsequent requests instantly.

### User's stated constraints

- **Personal / family use.** No multi-tenant concerns.
- **In-memory cache only.** No disk persistence.
- **Auto-prefetch the full video** when the player page opens.
- **LRU eviction** when the per-session memory cap is hit.
- **Free memory** when the player page closes.

### Out of scope (this iteration)

- Disk-backed cache.
- Cross-session cache sharing.
- Adaptive bitrate (ABR) logic changes inside hls.js.
- `videos` / `favorites` / `play_records` schema changes.
- Search, detail, favorites, play-records, theming UI changes.
- HTTP Range requests on segments (HLS.js does not use them).
- Low-latency HLS, fMP4 byte-streaming, HTTP/2 push optimizations.

---

## Approach

A new `m3u8-proxy` module on the server (paralleling the existing `image-proxy` module) acts as a **transparent reverse proxy** for m3u8 + segment traffic. Every byte that flows through the server is written to a per-session in-memory LRU. On session close, all memory is released.

The browser is reconfigured to fetch all m3u8 and `.ts` traffic through the server. A WebSocket carries real-time prefetch progress so the player UI can show a "caching N/M segments" badge.

The net effect: when prefetch completes, scrubbing the seek bar from start to end has no buffering stalls because every segment is already in server memory (microseconds away from the browser, regardless of upstream CDN speed).

---

## Architecture

```
┌─────────────┐   1. open /play  ┌────────────────────────┐
│   Browser   │ ────────────────▶│ PlayerPage mounts      │
│  (React)    │                  │  • create session      │
│             │                  │  • open WebSocket      │
│             │                  │  • start heartbeats    │
│             │                  │  • kick off prefetch   │
└──────┬──────┘                  └────────────┬───────────┘
       │                                       │
       │  2. hls.js requests                   │
       │     /m3u8-proxy/manifest?...          ▼
       │     /m3u8-proxy/segment?...   ┌────────────────────┐
       │ ────────────────────────────▶ │  NestJS server     │
       │                               │  m3u8-proxy module │
       │  3. server returns             │  • LRU mem cache   │
       │     m3u8 text / .ts bytes  ◀── │  • upstream fetch  │
       │                               │  • manifest rewrite│
       │                               └────────┬───────────┘
       │                                        │
       │       4. cache miss → upstream CDN     │
       │  (only happens on first request)       ▼
       │                              ┌──────────────────┐
       └──── 6. user watches ────────▶│ upstream 苹果CMS │
                                      │   CDN            │
                                      └──────────────────┘

7. WebSocket close / heartbeat timeout
   → server drops all cache entries for that session
```

### Key invariants

- The browser **always** fetches m3u8 + .ts through the server. No direct upstream traffic from the player.
- The server transparently caches every byte it forwards, in memory.
- A separate background worker on session open walks the entire m3u8 playlist and prefetches all segments ahead of the player.
- The cache is **scoped per session**. When the player page closes, the session ends, and all of that session's memory is released.
- LRU eviction caps total memory at a configurable limit (default 2 GB per session).

---

## Server module: `apps/server/src/m3u8-proxy/`

### File layout

```
m3u8-proxy/
├── m3u8-proxy.module.ts          # @Module wiring; imports ConfigModule
├── m3u8-proxy.controller.ts      # HTTP: sessions, manifest, segment
├── m3u8-proxy.gateway.ts         # WebSocket: per-session register, progress push, close signal
├── m3u8-proxy.service.ts         # orchestration: prefetch loop, fetch, cache lookups
├── session.store.ts              # session registry + heartbeat sweeper
├── cache.store.ts                # per-session LRU (Map-based, insertion order)
├── manifest.rewriter.ts          # line-based m3u8 parser + URL rewriter
├── manifest.types.ts             # m3u8 parsing types
├── m3u8-proxy.dto.ts             # Zod request/response shapes
├── config.ts                     # @Injectable wrapping M3u8ProxyConfig (reads YAML)
└── __tests__/
    ├── manifest.rewriter.spec.ts
    ├── cache.store.spec.ts
    └── m3u8-proxy.service.spec.ts
```

### HTTP endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/m3u8-proxy/sessions` | Create session for an upstream m3u8 URL. Body: `{ upstreamUrl: string }`. Returns `{ sessionId, manifestUrl }` where `manifestUrl` is the browser-usable URL (e.g. `/api/m3u8-proxy/manifest?session=<id>&url=<encoded>`). Server kicks off prefetch in background. |
| `GET`  | `/m3u8-proxy/manifest?session=<id>&url=<encoded>` | Fetch upstream m3u8, rewrite all segment/key/playlist URLs, return text. Re-parsed on every request (no caching of the manifest itself). |
| `GET`  | `/m3u8-proxy/segment?session=<id>&url=<encoded>` | Fetch upstream `.ts` / `.m4s` / key bytes, cache, return raw. |
| `POST` | `/m3u8-proxy/sessions/:id/heartbeat` | Refresh `lastSeen` timestamp. |
| `DELETE` | `/m3u8-proxy/sessions/:id` | Explicit close — drops all cache. |

### WebSocket endpoint

| Path | Purpose |
|---|---|
| `WS /m3u8-proxy/ws` | Per-connection WebSocket. Client sends `{ type: 'register', sessionId }` to bind. Server pushes `{ type: 'progress', done, total, bytes, capped }` events. On socket close → server drops the bound session. |

> **URL-prefix note:** the controller paths above are the **server-side** paths (after Vite/nginx strip the `/api` prefix). All paths the **browser** uses are prefixed with `/api` (e.g. browser calls `POST /api/m3u8-proxy/sessions`; server receives `POST /m3u8-proxy/sessions`). The WebSocket is similarly addressed at `ws://<host>/api/m3u8-proxy/ws` in the browser, which the Vite dev proxy and nginx production proxy both forward to the server's `/m3u8-proxy/ws` path. This matches the existing convention in `apps/web/vite.config.ts:14-20` and `apps/web/nginx.conf`.

### Reusing existing code

- **`apps/server/src/videos/core/utils/fetch.ts`** — `timedFetch(url, ms)` already wraps `fetch` with `AbortController` and a configurable timeout. Reuse for all upstream requests in this module.
- **`apps/server/src/image-proxy/`** — pattern reference for module + controller layout, controller-side cache, and file-system utilities. **Do not import from it** — the cache shape, URL handling, and lifecycle are different.
- **`apps/server/src/config/`** — extend `config.schema.ts` and `config.yml` to add a `m3u8Proxy` block. `ConfigService` exposes a new `getM3u8ProxyConfig()` method.
- **`apps/server/src/app.module.ts`** — register `M3u8ProxyModule` in the imports array. This is the only app-level wiring change.

### Cache store (per-session LRU)

`apps/server/src/m3u8-proxy/cache.store.ts`:

```ts
@Injectable()
export class SessionCache {
  private entries = new Map<string, Buffer>();   // insertion order = LRU order
  private bytes = 0;
  private readonly maxBytes: number;

  constructor(@Inject('M3U8_PROXY_CONFIG') cfg: M3u8ProxyConfig) {
    this.maxBytes = cfg.maxBytesPerSession;
  }

  get(key: string): Buffer | null {
    const v = this.entries.get(key);
    if (!v) return null;
    // re-insert to mark as recently used
    this.entries.delete(key);
    this.entries.set(key, v);
    return v;
  }

  has(key: string): boolean { return this.entries.has(key); }

  set(key: string, value: Buffer): { evictedKeys: string[] } {
    const evicted: string[] = [];
    const existing = this.entries.get(key);
    if (existing) {
      this.bytes -= existing.length;
      this.entries.delete(key);
    }
    this.entries.set(key, value);
    this.bytes += value.length;
    // evict oldest until under cap
    while (this.bytes > this.maxBytes && this.entries.size > 0) {
      const oldestKey = this.entries.keys().next().value as string;
      const oldestVal = this.entries.get(oldestKey)!;
      this.bytes -= oldestVal.length;
      this.entries.delete(oldestKey);
      evicted.push(oldestKey);
    }
    return { evictedKeys: evicted };
  }

  deleteByKeys(keys: Iterable<string>): void {
    for (const k of keys) {
      const v = this.entries.get(k);
      if (v) { this.bytes -= v.length; this.entries.delete(k); }
    }
  }

  size(): { count: number; bytes: number; maxBytes: number } {
    return { count: this.entries.size, bytes: this.bytes, maxBytes: this.maxBytes };
  }
}
```

Each session gets its own `SessionCache` instance. No cross-session LRU is needed for personal use.

### Session store

`apps/server/src/m3u8-proxy/session.store.ts`:

```ts
export interface Session {
  id: string;
  upstreamManifestUrl: string;
  createdAt: number;
  lastSeen: number;
  cache: SessionCache;
  cacheKeys: Set<string>;                       // populated as cache.set is called
  prefetchAbort: AbortController;
  wsConnections: Set<WebSocket>;
  prefetchState: { done: number; total: number; bytes: number; capped: boolean };
}

@Injectable()
export class SessionStore implements OnModuleDestroy {
  private sessions = new Map<string, Session>();
  private sweeperHandle: NodeJS.Timeout;

  constructor(@Inject('M3U8_PROXY_CONFIG') private cfg: M3u8ProxyConfig) {
    this.sweeperHandle = setInterval(() => this.sweep(), 30_000);
  }

  create(upstreamUrl: string): Session;
  get(id: string): Session | null;
  touch(id: string): void;                      // updates lastSeen
  close(id: string, reason: string): void;      // aborts prefetch, drops cache, closes WS
  list(): Session[];
  count(): number;

  private sweep(): void {
    const now = Date.now();
    for (const s of this.sessions.values()) {
      if (now - s.lastSeen > this.cfg.heartbeatTimeoutMs) {
        this.close(s.id, 'heartbeat-timeout');
      }
    }
  }

  onModuleDestroy(): void { clearInterval(this.sweeperHandle); /* close all sessions */ }
}
```

### m3u8 manifest rewriter

`apps/server/src/m3u8-proxy/manifest.rewriter.ts` — a small line-based parser. No external HLS library (too heavy).

**Input:** raw m3u8 text + `manifestBaseUrl` (the upstream URL) + `sessionId` + `proxyBase` (the public-facing path prefix the browser should use, e.g. `/api/m3u8-proxy`).
**Output:** rewritten m3u8 text where every URL-bearing line has been resolved and rewritten.

**Handled cases:**

| Line | Action |
|---|---|
| `#EXTM3U`, `#EXT-X-VERSION`, `#EXT-X-MEDIA-SEQUENCE`, `#EXT-X-TARGETDURATION`, `#EXT-X-ENDLIST`, `#EXT-X-DISCONTINUITY-SEQUENCE`, `#EXT-X-BYTERANGE`, `#EXT-X-DISCONTINUITY`, `#EXT-X-PROGRAM-DATE-TIME` | Pass through. |
| `#EXT-X-KEY URI="..."` | Rewrite `URI` value to `${proxyBase}/segment?...`. Other attributes (`IV`, `KEYFORMAT`, `KEYFORMATVERSIONS`) pass through. |
| `#EXT-X-MAP URI="..."` | Rewrite `URI` value to `${proxyBase}/segment?...`. |
| `#EXT-X-STREAM-INF` followed by a URL line | Rewrite the URL line. URLs ending in `.m3u8` go to `${proxyBase}/manifest?...` (recursive). Other attributes (`BANDWIDTH`, `RESOLUTION`, `CODECS`) pass through. |
| `#EXT-X-MEDIA TYPE=... URI="..."` | Rewrite `URI` value. |
| Any other non-empty, non-comment line | Treat as a URL. Resolve against `manifestBaseUrl`. URLs ending in `.m3u8` go to `/manifest?…`; everything else goes to `/segment?…`. |

**Edge cases:**

- **Relative URLs** resolved against the manifest base URL.
- **Query strings** preserved via `encodeURIComponent`.
- **Byte-range hints** (`#EXT-X-BYTERANGE`) pass through unchanged.
- **Encryption keys** are proxied transparently — the server does not decrypt; hls.js handles decryption in the browser.
- **Nested playlists** are rewritten through `/manifest?…` so the server fetches them on demand. We do **not** recursively prefetch nested playlists (the player picks one variant and only requests its segments).

The m3u8 manifest itself is **not cached** — it is parsed and rewritten on every `/manifest` request. Each request is cheap (KB of text, sub-millisecond parse) and avoids stale-when-m3u8-updates problems.

### Prefetch loop

`M3u8ProxyService.startPrefetch(session, manifestUrl)`:

1. `timedFetch(manifestUrl, upstreamTimeoutMs)` → upstream m3u8 text.
2. `manifest.rewriter.parse(text, manifestUrl)` → list of segment URLs (and key URLs).
3. Push initial progress to WS subscribers: `{ type: 'progress', done: 0, total: N, bytes: 0, capped: false }`.
4. For each `segmentUrl` in order:
   - If `session.prefetchAbort.signal.aborted` → break.
   - If `session.cache.has(segmentUrl)` → increment `done`, continue.
   - `timedFetch(segmentUrl, upstreamTimeoutMs)` → `Buffer`.
   - `session.cache.set(segmentUrl, buf)` — may evict oldest in same session. Track evicted keys.
   - Add `segmentUrl` to `session.cacheKeys`.
   - Push progress to WS subscribers: `{ type: 'progress', done, total, bytes, capped }`.
   - `await new Promise(r => setImmediate(r))` — yield to event loop.
5. Push final progress: `{ type: 'progress', done, total, bytes, capped }` (`capped: true` if `cache.size().bytes >= maxBytesPerSession`).

**Eviction behavior:** the loop continues even after eviction. The most recently fetched N segments within the cap remain in cache. The player's on-demand fetches can re-populate older segments if needed (each is itself an upstream fetch, which can re-evict).

### Config additions

`apps/server/src/config/config.schema.ts`:

```ts
const M3u8ProxyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxBytesPerSession: z.number().int().positive().default(2 * 1024 * 1024 * 1024), // 2 GB
  upstreamTimeoutMs: z.number().int().positive().default(10_000),
  heartbeatTimeoutMs: z.number().int().positive().default(60_000),
  maxConcurrentSessions: z.number().int().positive().default(4),
});

const AppConfigSchema = z.object({
  sources: z.array(SourceSchema),
  m3u8Proxy: M3u8ProxyConfigSchema.optional(),
});
```

`apps/server/config.yml`:

```yaml
m3u8Proxy:
  enabled: true
  maxBytesPerSession: 2147483648   # 2 GB
  upstreamTimeoutMs: 10000
  heartbeatTimeoutMs: 60000
  maxConcurrentSessions: 4
```

### Safety guards

- **Session cap:** `POST /m3u8-proxy/sessions` returns HTTP 503 if `sessions.size() >= maxConcurrentSessions`.
- **Boot memory check:** at module init, log a warning if `maxConcurrentSessions × maxBytesPerSession` exceeds `process.memoryUsage().heapTotal`.
- **Event loop yield:** prefetch loop awaits `setImmediate` between iterations.
- **Cancellation:** `AbortController` per session — prefetch loop is cancellable on close.
- **Resource cleanup:** `SessionStore.onModuleDestroy` clears the sweeper interval and closes every open session.

---

## Web integration: `apps/web/src/features/video-player/`

### Files

| File | Change |
|---|---|
| `pages/PlayerPage.tsx` | **Modify.** On mount, call `createSession()`, open WS, start heartbeats, render `<PrefetchIndicator>`. On unmount and `beforeunload`: close WS, `navigator.sendBeacon(DELETE /m3u8-proxy/sessions/:id)`, clear interval. Pass `manifestUrl` (server-proxied) to `<HlsPlayer>`. |
| `components/HlsPlayer.tsx` | **Modify.** Receives `url` and `prefetchState` props. Forwards `url` to the hook unchanged. Renders `<PrefetchIndicator state={prefetchState} />` as an overlay. |
| `hooks/useHlsPlayer.ts` | **No change.** hls.js is already URL-agnostic. |
| `api/proxyApi.ts` (new) | `createSession(upstreamUrl)`, `endSession(sessionId)`, `sendHeartbeat(sessionId)`, `buildProxySegmentUrl(sessionId, upstreamUrl)`, `buildProxyManifestUrl(sessionId, upstreamUrl)`. |
| `hooks/useProxySession.ts` (new) | Session lifecycle hook. Opens WS, sends `register`, runs heartbeat interval, cleans up on unmount. Returns `{ sessionId, status, progress }`. |
| `hooks/usePrefetchProgress.ts` (new) | Subscribes to WS `progress` events. Returns the latest `{ done, total, bytes, capped }`. |
| `components/PrefetchIndicator.tsx` (new) | Floating badge bottom-right inside the player. Four visual states: `prefetching`, `ready`, `capped`, hidden on error. No buttons, no auto-dismiss. |

### Files NOT changed

- `shared/utils/video.ts` — `getEpisodeHref` keeps returning `/play?url=<encoded>`. `PlayerPage` turns the upstream URL into a proxy URL after session creation.
- `router.tsx`, search, detail, favorites, play-records, theming — untouched.
- `package.json` (web) — no new dependencies. WebSocket is native in browsers.

### Network from the browser

```
1. PlayerPage mounts
   → POST /api/m3u8-proxy/sessions   body: { upstreamUrl: "https://cdn.example/abc.m3u8" }
   ← { sessionId: "abc123", manifestUrl: "/api/m3u8-proxy/manifest?session=abc123&url=..." }

2. <HlsPlayer url={manifestUrl} />   // hls.js calls loadSource(manifestUrl)

3. hls.js fetches manifest
   ← rewritten m3u8 text; segment lines look like:
     /api/m3u8-proxy/segment?session=abc123&url=https%3A%2F%2Fcdn.example%2Fseg-001.ts
     /api/m3u8-proxy/segment?session=abc123&url=https%3A%2F%2Fcdn.example%2Fseg-002.ts
     ...

4. hls.js fetches each segment through the proxy
   - First request for a URL → upstream fetch, cache.set, return.
   - Subsequent request for the same URL → cache hit, return.

5. PlayerPage also opens WS /api/m3u8-proxy/ws
   → sends { type: "register", sessionId: "abc123" }
   ← server pushes { type: "progress", done, total, bytes, capped } on each segment

6. PlayerPage runs setInterval(POST /sessions/:id/heartbeat, 15_000)

7. PlayerPage unmounts OR beforeunload fires
   - close WebSocket
   - navigator.sendBeacon("/api/m3u8-proxy/sessions/abc123", { _method: "DELETE" })
   - clearInterval
```

Vite dev proxy (`apps/web/vite.config.ts`) and nginx (`apps/web/nginx.conf`) already pass `/api/*` to `:3000`, so no proxy config changes are needed.

### UI states

| State | Badge text |
|---|---|
| `prefetching` (0 < done < total) | `缓存中 · 12/40 段 (245MB)` |
| `ready` (done === total, !capped) | `✓ 已缓存完整视频` |
| `capped` (cache at byte cap) | `✓ 已缓存 18/40 段 (内存已满)` |
| `error` | (badge hidden) |

---

## Error handling matrix

| Failure | Server behavior | Player behavior |
|---|---|---|
| Upstream `fetch` times out (10s) | 504 with `upstream-timeout` in body. Logged at WARN with session id and URL. | hls.js retries with backoff. |
| Upstream returns 4xx | Pass-through status code. Logged at WARN with session id and URL. | hls.js marks segment error and tries next in playlist. |
| Upstream returns 5xx | 502 with `upstream-<status>`. Logged at WARN. | hls.js retries. |
| Upstream returns HTML (e.g. 404 page served as 200) | Detect `Content-Type` not matching `application/vnd.apple.mpegurl`. Return 502 with `invalid-manifest`. | hls.js logs error; player UI shows existing `ErrorMessage`. |
| Connection reset mid-body | `fetch` throws → 502 with `upstream-reset`. | hls.js retries. |
| DNS failure | `fetch` throws → 502 with `upstream-dns`. | hls.js retries (will fail repeatedly; user sees error). |

The proxy never **partially** buffers a response. Either the entire segment is in memory or the request fails. This keeps cache entries always-consistent.

---

## Edge cases

| Event | Server behavior |
|---|---|
| Page refresh (full reload) | WS closes → server drops session. New page creates a new session. No state carried over. |
| Browser tab close | WS closes → same as above. `navigator.sendBeacon` is belt-and-suspenders. |
| Network blip (player offline) | Heartbeats fail to reach server. After 60 s without heartbeat, sweeper drops the session. |
| User navigates within SPA (back to detail) | `PlayerPage` unmounts → WS closes → session dropped immediately. No 60 s wait. |
| User opens same video in two tabs | Two independent sessions, two independent caches. Either tab can fully benefit from its own cache. |
| Server restart | All in-memory state lost. Player retries upstream via the proxy; first request becomes a cache miss. |
| User seeks back to evicted segment | Cache miss → upstream fetch → re-cached (may itself evict). Player sees normal latency for that one request. |

Multi-user note: even though today this is personal use, the `SessionStore` API is per-session, not per-user. The cap of `maxConcurrentSessions: 4` would behave correctly with multiple users, but no per-user isolation is implemented. **Out of scope for this iteration.**

---

## Testing strategy

### Unit tests

**`apps/server/src/m3u8-proxy/__tests__/manifest.rewriter.spec.ts`**

Fixture inputs covering:
- Simple single-bitrate playlist with absolute segment URLs.
- Playlist with relative segment URLs.
- Master playlist with `EXT-X-STREAM-INF` and a child `.m3u8`.
- Encrypted playlist (`EXT-X-KEY URI=...`).
- fMP4 playlist (`EXT-X-MAP URI=...`).
- Alternate renditions (`EXT-X-MEDIA TYPE=AUDIO URI=...`).
- Playlist with byte-range hints.
- Playlist with comment lines and empty lines.

Each fixture compares line-by-line to expected output.

**`apps/server/src/m3u8-proxy/__tests__/cache.store.spec.ts`**

- LRU ordering: get reorders; oldest evicted first when crossing cap.
- Eviction when crossing cap.
- `get` after `set` re-inserts and marks recent.
- `deleteByKeys` releases bytes and removes entries.
- Exact-cap boundary: setting a value that exactly hits the cap does not evict.
- Setting the same key twice: old size subtracted, new size added.

### Integration tests

**`apps/server/src/m3u8-proxy/__tests__/m3u8-proxy.service.spec.ts`**

Uses a tiny in-test upstream HTTP server (Node `http.createServer`).

- `createSession` → prefetch loops through all segments, populates cache, last progress event has `done === total`.
- `closeSession` → cache is empty, prefetch loop aborted (verify with a `spy` on the fetch).
- Player request after `closeSession` returns 404.
- Cache hit on second request for same segment URL (verify fetch called once).
- Master playlist: `/manifest` returns rewritten master; the child manifest URL is also rewritten; fetching that child URL recursively rewrites.
- Upstream 500: `/segment` returns 502; cache size unchanged.
- Heartbeat timeout: simulate 60 s no heartbeat → session dropped by sweeper.

### End-to-end (manual)

- Open `/play?url=<real upstream>` in a browser, observe the badge transition from `缓存中 · 0/40` to `缓存中 · 40/40`, watch a full episode, verify no buffering stalls.
- Open the same video in a second tab, verify it gets its own session (different `sessionId` in WS).
- Refresh the page mid-prefetch, verify the new session starts prefetching from 0.

---

## Verification (end-to-end)

```bash
# Type checks
cd apps/server && pnpm typecheck
cd apps/web    && pnpm typecheck

# Unit + integration tests
cd apps/server && pnpm test
#   apps/server/src/m3u8-proxy/__tests__/manifest.rewriter.spec.ts
#   apps/server/src/m3u8-proxy/__tests__/cache.store.spec.ts
#   apps/server/src/m3u8-proxy/__tests__/m3u8-proxy.service.spec.ts
```

**Manual smoke test:**

```bash
pnpm dev:server     # nestjs on :3000
pnpm dev:web        # vite on :5173
```

In a browser:
1. Search a video, open detail, click an episode → player page loads.
2. Observe the badge: `缓存中 · 0/40` → progressively increments.
3. After badge shows `✓ 已缓存完整视频`, scrub the seek bar to the end → playback is instant, no buffering.
4. Open the same video in a second tab → second session has its own progress.
5. Close the first tab → server log shows `m3u8-proxy session=<id> closed reason=ws-disconnect` and total memory drops.
6. Refresh mid-prefetch → new session starts from 0.

**Error path checks:**
- Pause upstream (e.g. with `iptables` block of the upstream CDN) before opening player → expect 502/504 on segment requests, badge stays at `缓存中 · 0/N` (does not crash).
- Open a player pointing at a URL that returns HTML → expect 502 with `invalid-manifest`.

---

## Critical files

### Create

**Server:**
- `apps/server/src/m3u8-proxy/m3u8-proxy.module.ts`
- `apps/server/src/m3u8-proxy/m3u8-proxy.controller.ts`
- `apps/server/src/m3u8-proxy/m3u8-proxy.gateway.ts`
- `apps/server/src/m3u8-proxy/m3u8-proxy.service.ts`
- `apps/server/src/m3u8-proxy/session.store.ts`
- `apps/server/src/m3u8-proxy/cache.store.ts`
- `apps/server/src/m3u8-proxy/manifest.rewriter.ts`
- `apps/server/src/m3u8-proxy/manifest.types.ts`
- `apps/server/src/m3u8-proxy/m3u8-proxy.dto.ts`
- `apps/server/src/m3u8-proxy/config.ts`
- `apps/server/src/m3u8-proxy/__tests__/manifest.rewriter.spec.ts`
- `apps/server/src/m3u8-proxy/__tests__/cache.store.spec.ts`
- `apps/server/src/m3u8-proxy/__tests__/m3u8-proxy.service.spec.ts`

**Web:**
- `apps/web/src/features/video-player/api/proxyApi.ts`
- `apps/web/src/features/video-player/hooks/useProxySession.ts`
- `apps/web/src/features/video-player/hooks/usePrefetchProgress.ts`
- `apps/web/src/features/video-player/components/PrefetchIndicator.tsx`

### Modify

- `apps/server/src/app.module.ts` — register `M3u8ProxyModule`
- `apps/server/src/config/config.schema.ts` — add `m3u8Proxy` block
- `apps/server/src/config/config.service.ts` — expose `getM3u8ProxyConfig()`
- `apps/server/config.yml` — add `m3u8Proxy` block with defaults
- `apps/web/src/features/video-player/pages/PlayerPage.tsx` — session lifecycle
- `apps/web/src/features/video-player/components/HlsPlayer.tsx` — render indicator

### Not touched

- `apps/server/src/database/schema.ts` (no schema changes; the m3u8 proxy is stateless and table-less)
- `apps/web/src/shared/utils/video.ts` (no URL format change)
- `apps/web/vite.config.ts` and `apps/web/nginx.conf` (existing `/api` proxy is sufficient)
- Any feature other than `video-player` on the web side
- `package.json` (server or web) — no new dependencies
