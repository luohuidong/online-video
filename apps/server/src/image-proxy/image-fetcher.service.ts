import { Injectable } from '@nestjs/common';
import {
  ImageTooLargeError,
  UnsupportedContentTypeError,
  UpstreamFetchError,
} from './image-proxy.errors';

// Only the image formats the Mac CMS upstream providers actually serve
// for video covers. GIF/AVIF/SVG are intentionally excluded to keep the
// cache predictable and to avoid storing scriptable payloads.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MiB hard cap
const FETCH_TIMEOUT_MS = 10_000; // abort slow upstreams to free the request slot

export interface FetchedImage {
  contentType: string;
  buffer: Buffer;
}

// Pulls an image from `url`, validates the response, and returns the raw
// bytes. Throws a domain error for every failure mode the HTTP layer
// knows how to render — the controller decides the status code.
@Injectable()
export class ImageFetcherService {
  async fetch(url: string): Promise<FetchedImage> {
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      throw new UpstreamFetchError('Failed to fetch upstream image');
    }

    if (!upstreamRes.ok) {
      throw new UpstreamFetchError(
        `Upstream returned ${upstreamRes.status}`,
        upstreamRes.status,
      );
    }

    const rawContentType = upstreamRes.headers.get('content-type') ?? '';
    const [firstType = ''] = rawContentType.split(';');
    const contentType = firstType.trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new UnsupportedContentTypeError(contentType);
    }

    // Pre-check via Content-Length when the upstream bothers to send it,
    // then re-check after the read in case the header was missing or lied.
    const declaredLength = Number(upstreamRes.headers.get('content-length'));
    if (declaredLength > 0 && declaredLength > MAX_IMAGE_BYTES) {
      throw new ImageTooLargeError(declaredLength);
    }

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new ImageTooLargeError(buffer.length);
    }

    return { contentType, buffer };
  }
}
