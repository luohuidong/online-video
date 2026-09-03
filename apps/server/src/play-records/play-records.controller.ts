import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
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

const OkResponse = {
  schema: { properties: { ok: { type: 'boolean', example: true } } },
};

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
  @ApiOkResponse({ type: PlayRecordDto, description: '不存在时返回 null' })
  getOne(
    @Param('sourceId') sourceId: string,
    @Param('sourceVideoId') sourceVideoId: string,
  ) {
    return this.playRecordsService.getOne(sourceId, sourceVideoId);
  }

  @Put()
  @ApiOperation({ summary: '新增/更新播放记录（upsert）' })
  @ApiBody({ type: UpsertPlayRecordDto })
  @ApiOkResponse(OkResponse)
  @ApiBadRequestResponse({ description: '请求体校验失败' })
  upsert(@Body() body: unknown) {
    const result = UpsertPlayRecordSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    this.playRecordsService.upsert(result.data);
    return { ok: true };
  }

  @Delete()
  @ApiOperation({ summary: '清空所有播放记录' })
  @ApiOkResponse(OkResponse)
  clearAll() {
    this.playRecordsService.clearAll();
    return { ok: true };
  }

  @Delete(':sourceId/:sourceVideoId')
  @ApiOperation({ summary: '删除单条播放记录' })
  @ApiParam({ name: 'sourceId', description: '视频源标识' })
  @ApiParam({ name: 'sourceVideoId', description: '视频在平台上的 ID' })
  @ApiOkResponse(OkResponse)
  remove(
    @Param('sourceId') sourceId: string,
    @Param('sourceVideoId') sourceVideoId: string,
  ) {
    this.playRecordsService.remove(sourceId, sourceVideoId);
    return { ok: true };
  }
}
