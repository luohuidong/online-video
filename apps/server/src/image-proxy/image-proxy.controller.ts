import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

const CACHE_DIR = join(process.cwd(), '.cache', 'images');

@Controller('image-proxy')
export class ImageProxyController {
  @Get()
  @ApiOperation({ summary: '代理并缓存第三方封面图' })
  @ApiQuery({ name: 'url', description: '图片原始地址', type: String })
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) throw new BadRequestException('Missing url parameter');

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException('Invalid url parameter');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException('Only http/https URLs are allowed');
    }

    const hash = createHash('sha256').update(url).digest('hex');
    const imgPath = join(CACHE_DIR, hash);
    const metaPath = join(CACHE_DIR, `${hash}.ct`);

    // Serve from cache if exists
    if (existsSync(imgPath)) {
      const contentType = existsSync(metaPath) ? readFileSync(metaPath, 'utf8') : 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=2592000'); // 30 days
      res.send(readFileSync(imgPath));
      return;
    }

    // Fetch from upstream
    let upstreamRes: globalThis.Response;
    try {
      upstreamRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      res.status(502).send('Failed to fetch upstream image');
      return;
    }

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).send('Upstream error');
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    // Save to cache
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(imgPath, buffer);
    writeFileSync(metaPath, contentType);

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=2592000');
    res.send(buffer);
  }
}
