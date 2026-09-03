import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  type BatchUpdateRequestDto,
  BatchUpdateResponseDto,
  SearchResponseDto,
  SearchResultDto,
} from './videos.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiOperation({ summary: '跨源聚合搜索' })
  @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
  @ApiOkResponse({ type: SearchResponseDto, description: '聚合搜索结果' })
  @ApiBadRequestResponse({ description: '搜索关键词不能为空' })
  async search(@Query('q') q: string) {
    if (!q?.trim()) throw new BadRequestException('搜索关键词不能为空');
    const groups = await this.videosService.search(q.trim());
    return { groups };
  }

  @Get(':sourceId/:sourceVideoId')
  @ApiOperation({ summary: '获取指定源的视频详情' })
  @ApiParam({
    name: 'sourceId',
    description: '视频源标识（来自 /config 接口的 source.sourceId）',
  })
  @ApiParam({ name: 'sourceVideoId', description: '视频 ID' })
  @ApiOkResponse({
    type: SearchResultDto,
    description: '视频详情（含完整剧集列表）',
  })
  @ApiNotFoundResponse({ description: '视频源不存在' })
  @ApiBadGatewayResponse({ description: '上游视频源暂时不可用' })
  async getDetail(
    @Param('sourceId') sourceId: string,
    @Param('sourceVideoId') sourceVideoId: string,
  ) {
    try {
      return await this.videosService.getDetail(sourceId, sourceVideoId);
    } catch (err) {
      const msg: string = err instanceof Error ? err.message : '获取详情失败';
      if (msg.startsWith('Source not found:')) throw new NotFoundException(msg);
      throw new HttpException(
        { message: '上游视频源暂时不可用，请稍后重试或切换其他源', error: msg },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('batch-update')
  @ApiOperation({ summary: '批量更新收藏夹视频的集数信息' })
  @ApiOkResponse({ type: BatchUpdateResponseDto, description: '批量更新结果' })
  @ApiBadRequestResponse({ description: '请求参数无效' })
  @ApiBadGatewayResponse({ description: '上游视频源暂时不可用' })
  async batchUpdate(@Body() body: BatchUpdateRequestDto) {
    try {
      const results = await this.videosService.batchUpdate(body.sourceGroups);
      return { results };
    } catch (err) {
      const msg: string = err instanceof Error ? err.message : '批量更新失败';
      throw new HttpException(
        { message: '上游视频源暂时不可用，请稍后重试', error: msg },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
