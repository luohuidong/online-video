import { Module } from '@nestjs/common';
import { PlayRecordsController } from './play-records.controller';
import { PlayRecordsService } from './play-records.service';

@Module({
  controllers: [PlayRecordsController],
  providers: [PlayRecordsService],
})
export class PlayRecordsModule {}
