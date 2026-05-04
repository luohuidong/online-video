import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
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
import { VideosService } from './videos.service';
import { SearchResponseDto, SearchResultDto } from './videos.dto';

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
    const results = await this.videosService.search(q.trim());
    return { results };
  }

  @Get(':source/:id')
  @ApiOperation({ summary: '获取指定源的视频详情' })
  @ApiParam({ name: 'source', description: '视频源标识（来自 /config 接口的 source.sourceId）' })
  @ApiParam({ name: 'id', description: '视频 ID' })
  @ApiOkResponse({ type: SearchResultDto, description: '视频详情（含完整剧集列表）' })
  @ApiNotFoundResponse({ description: '视频源不存在' })
  @ApiBadGatewayResponse({ description: '上游视频源暂时不可用' })
  async getDetail(@Param('source') source: string, @Param('id') id: string) {
    try {
      return await this.videosService.getDetail(source, id);
    } catch (err: any) {
      const msg: string = err.message ?? '获取详情失败';
      if (msg.startsWith('Source not found:')) throw new NotFoundException(msg);
      throw new HttpException(
        { message: '上游视频源暂时不可用，请稍后重试或切换其他源', error: msg },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
