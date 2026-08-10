import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [AppConfigModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
