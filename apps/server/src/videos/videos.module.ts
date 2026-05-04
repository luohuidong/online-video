import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
