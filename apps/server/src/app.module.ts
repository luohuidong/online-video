import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ImageProxyModule } from './image-proxy/image-proxy.module';
import { PlayRecordsModule } from './play-records/play-records.module';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    VideosModule,
    FavoritesModule,
    PlayRecordsModule,
    ImageProxyModule,
  ],
})
export class AppModule {}
