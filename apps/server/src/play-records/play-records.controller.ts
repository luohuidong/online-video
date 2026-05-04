import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PlayRecordsService } from './play-records.service';
import { PlayRecordDto, UpsertPlayRecordDto, UpsertPlayRecordSchema } from './play-records.dto';

const OkResponse = { schema: { properties: { ok: { type: 'boolean', example: true } } } };

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

  @Get(':source/:videoId')
  @ApiOperation({ summary: '获取单条播放记录' })
  @ApiParam({ name: 'source', description: '视频源标识' })
  @ApiParam({ name: 'videoId', description: '视频在平台上的 ID' })
  @ApiOkResponse({ type: PlayRecordDto, description: '不存在时返回 null' })
  getOne(@Param('source') source: string, @Param('videoId') videoId: string) {
    return this.playRecordsService.getOne(source, videoId);
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

  @Delete(':source/:videoId')
  @ApiOperation({ summary: '删除单条播放记录' })
  @ApiParam({ name: 'source', description: '视频源标识' })
  @ApiParam({ name: 'videoId', description: '视频在平台上的 ID' })
  @ApiOkResponse(OkResponse)
  remove(@Param('source') source: string, @Param('videoId') videoId: string) {
    this.playRecordsService.remove(source, videoId);
    return { ok: true };
  }
}