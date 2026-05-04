import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, VideosModule],
})
export class AppModule {}
