import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ProxyUrlSchema } from './dto';
import {
  ImageTooLargeError,
  UnsupportedContentTypeError,
  UpstreamFetchError,
} from './errors';
import { imageProxyService } from './service';

const CACHE_HEADER = 'public, max-age=2592000'; // 30 days
const TEXT_HEADER = { 'Content-Type': 'text/plain; charset=utf-8' } as const;

// Wrap the content hash in a weak ETag. Weak is appropriate because the
// underlying bytes are stable, but we don't promise byte-for-byte identity
// with the original upstream response (e.g. if a future transform layer
// is added between cache and response).
const makeEtag = (hash: string) => `W/"${hash}"`;

const imageProxyRoutes = new Hono();

// GET /image-proxy?url=... — 代理并缓存第三方封面图
imageProxyRoutes.get('/', zValidator('query', ProxyUrlSchema), async (c) => {
  const { url } = c.req.valid('query');
  const ifNoneMatch = c.req.header('if-none-match');

  try {
    const result = await imageProxyService.proxy(url);
    const etag = makeEtag(result.hash);

    // The client's cached copy is still valid — return 304 with no
    // body. ETag and Cache-Control are still set so the client can
    // refresh its freshness timer.
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': CACHE_HEADER },
      });
    }

    return new Response(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': CACHE_HEADER,
        ETag: etag,
      },
    });
  } catch (err) {
    // HTTP status mapping for each domain error. Anything that doesn't
    // match is a genuine bug — re-throw so app.onError turns it into a 500.
    if (err instanceof UnsupportedContentTypeError) {
      return new Response(err.message, { status: 415, headers: TEXT_HEADER });
    }
    if (err instanceof ImageTooLargeError) {
      return new Response(err.message, { status: 413, headers: TEXT_HEADER });
    }
    if (err instanceof UpstreamFetchError) {
      return new Response(err.message, {
        status: err.status ?? 502,
        headers: TEXT_HEADER,
      });
    }
    throw err;
  }
});

export default imageProxyRoutes;
