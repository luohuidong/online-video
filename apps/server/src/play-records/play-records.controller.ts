import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  PlayRecordDto,
  UpsertPlayRecordDto,
  UpsertPlayRecordSchema,
} from './play-records.dto';
import { PlayRecordsService } from './play-records.service';

@ApiTags('play-records')
@Controller('play-records')
export class PlayRecordsController {
  constructor(private readonly playRecordsService: PlayRecordsService) {}

  @Get()
  @ApiOperation({ summary: '获取全部播放记录（按保存时间倒序）' })
  @ApiOkResponse({ type: [PlayRecordDto] })
  getAll() {
    return this.playRecordsService.getAll();
  }

  @Get(':sourceId/:sourceVideoId')
  @ApiOperation({ summary: '获取单条播放记录' })
  @ApiParam({ name: 'sourceId', description: '视频源标识' })
  @ApiParam({ name: 'sourceVideoId', description: '视频在平台上的 ID' })
  @ApiOkResponse({ type: PlayRecordDto })
  @ApiNotFoundResponse({ description: '记录不存在' })
  getOne(
    @Param('sourceId') sourceId: string,
    @Param('sourceVideoId') sourceVideoId: string,
  ) {
    const record = this.playRecordsService.getOne(sourceId, sourceVideoId);
    if (!record) {
      throw new NotFoundException(
        `Play record not found for ${sourceId}/${sourceVideoId}`,
      );
    }
    return record;
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '新增/更新播放记录（upsert）' })
  @ApiBody({ type: UpsertPlayRecordDto })
  @ApiOkResponse({ type: PlayRecordDto, description: 'upsert 后的播放记录' })
  @ApiBadRequestResponse({ description: '请求体校验失败' })
  upsert(@Body() body: unknown) {
    const result = UpsertPlayRecordSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return this.playRecordsService.upsert(result.data);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '清空所有播放记录' })
  @ApiNoContentResponse({ description: '清空成功' })
  clearAll(): void {
    this.playRecordsService.clearAll();
  }

  @Delete(':sourceId/:sourceVideoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除单条播放记录' })
  @ApiParam({ name: 'sourceId', description: '视频源标识' })
  @ApiParam({ name: 'sourceVideoId', description: '视频在平台上的 ID' })
  @ApiNoContentResponse({ description: '删除成功' })
  remove(
    @Param('sourceId') sourceId: string,
    @Param('sourceVideoId') sourceVideoId: string,
  ): void {
    this.playRecordsService.remove(sourceId, sourceVideoId);
  }
}
