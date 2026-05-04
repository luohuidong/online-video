import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { VideosModule } from './videos/videos.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PlayRecordsModule } from './play-records/play-records.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    VideosModule,
    FavoritesModule,
    PlayRecordsModule,
  ],
})
export class AppModule {}
