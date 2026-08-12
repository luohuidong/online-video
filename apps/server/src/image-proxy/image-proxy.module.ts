import { Module } from '@nestjs/common';
import { ImageCacheService } from './image-cache.service';
import { ImageFetcherService } from './image-fetcher.service';
import { ImageProxyController } from './image-proxy.controller';
import { ImageProxyService } from './image-proxy.service';

// Wires the HTTP edge (controller), the orchestration layer (service),
// and the two leaves (cache, fetcher). All four providers are singletons
// and have no cross-module dependencies.
@Module({
  controllers: [ImageProxyController],
  providers: [ImageProxyService, ImageCacheService, ImageFetcherService],
})
export class ImageProxyModule {}
