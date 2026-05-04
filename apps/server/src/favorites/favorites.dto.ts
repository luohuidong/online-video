import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const AddFavoriteSchema = z.object({
  sourceId: z.string().min(1),
  sourceVideoId: z.string().min(1),
  title: z.string().min(1),
  sourceName: z.string().min(1),
  cover: z.string().optional().default(''),
  year: z.string().optional().default(''),
  totalEpisodes: z.number().int().nonnegative().optional().default(0),
});

export class AddFavoriteDto {
  @ApiProperty({ description: '视频源标识' })
  sourceId!: string;

  @ApiProperty({ description: '视频在平台上的 ID' })
  sourceVideoId!: string;

  @ApiProperty({ description: '视频标题' })
  title!: string;

  @ApiProperty({ description: '视频源名称' })
  sourceName!: string;

  @ApiPropertyOptional({ description: '封面图片 URL', default: '' })
  cover?: string;

  @ApiPropertyOptional({ description: '年份', default: '' })
  year?: string;

  @ApiPropertyOptional({ description: '总集数', default: 0 })
  totalEpisodes?: number;
}

export class VideoInfoDto {
  @ApiProperty({ description: '视频 ID' })
  id!: number;

  @ApiProperty({ description: '视频标题' })
  title!: string;

  @ApiProperty({ description: '视频源标识' })
  sourceId!: string;

  @ApiProperty({ description: '视频在平台上的 ID' })
  sourceVideoId!: string;

  @ApiProperty({ description: '视频源名称' })
  sourceName!: string;

  @ApiPropertyOptional({ description: '封面图片 URL' })
  cover!: string | null;

  @ApiPropertyOptional({ description: '年份' })
  year!: string | null;

  @ApiPropertyOptional({ description: '总集数' })
  totalEpisodes!: number | null;
}

export class FavoriteRecordDto {
  @ApiProperty({ description: '收藏记录 ID' })
  id!: number;

  @ApiProperty({ description: '更新时间戳' })
  updatedAt!: number;

  @ApiProperty({ description: '视频信息', type: VideoInfoDto })
  video!: VideoInfoDto;
}