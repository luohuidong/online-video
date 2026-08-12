import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { flattenError } from 'zod';
import { ProxyUrlSchema } from './image-proxy.dto';
import {
  ImageTooLargeError,
  UnsupportedContentTypeError,
  UpstreamFetchError,
} from './image-proxy.errors';
import { ImageProxyService } from './image-proxy.service';

const CACHE_HEADER = 'public, max-age=2592000'; // 30 days

// Wrap the content hash in a weak ETag. Weak is appropriate because the
// underlying bytes are stable, but we don't promise byte-for-byte identity
// with the original upstream response (e.g. if a future transform layer
// is added between cache and response).
const makeEtag = (hash: string) => `W/"${hash}"`;

// Thin HTTP layer for the image proxy. Validates the query string,
// delegates the work to ImageProxyService, and translates domain errors
// into HTTP status codes. ETag/304 negotiation lives here.
@Controller('image-proxy')
export class ImageProxyController {
  constructor(private readonly imageProxyService: ImageProxyService) {}

  @Get()
  @ApiOperation({ summary: '代理并缓存第三方封面图' })
  @ApiQuery({ name: 'url', description: '图片原始地址', type: String })
  async proxy(
    @Query('url') url: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() res: Response,
  ) {
    const parsed = ProxyUrlSchema.safeParse({ url });
    if (!parsed.success) {
      throw new BadRequestException(flattenError(parsed.error));
    }

    try {
      const result = await this.imageProxyService.proxy(parsed.data.url);
      const etag = makeEtag(result.hash);

      // The client's cached copy is still valid — return 304 with no
      // body. ETag and Cache-Control are still set so the client can
      // refresh its freshness timer.
      if (ifNoneMatch === etag) {
        res.set('ETag', etag);
        res.set('Cache-Control', CACHE_HEADER);
        res.status(304).end();
        return;
      }

      res.set('Content-Type', result.contentType);
      res.set('Cache-Control', CACHE_HEADER);
      res.set('ETag', etag);
      res.send(result.buffer);
    } catch (err) {
      // HTTP status mapping for each domain error. Anything that doesn't
      // match is a genuine bug — re-throw so Nest's default filter turns
      // it into a 500 with a stack trace.
      if (err instanceof UnsupportedContentTypeError) {
        res.status(415).send(err.message);
        return;
      }
      if (err instanceof ImageTooLargeError) {
        res.status(413).send(err.message);
        return;
      }
      if (err instanceof UpstreamFetchError) {
        res.status(err.status ?? 502).send(err.message);
        return;
      }
      throw err;
    }
  }
}
