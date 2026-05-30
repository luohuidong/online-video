import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty({ description: '视频在数据源中的 ID' })
  sourceVideoId!: string;

  title!: string;

  @ApiProperty({ description: '海报图片 URL' })
  poster!: string;

  @ApiProperty({ type: [String], description: '剧集播放组' })
  videoPlayGroups!: string[];

  @ApiProperty({ description: '视频源标识' })
  sourceId!: string;

  @ApiProperty({ description: '视频源名称' })
  sourceName!: string;

  @ApiProperty({ description: '年份' })
  year!: string;

  @ApiPropertyOptional({ description: '简介' })
  desc?: string;

  @ApiPropertyOptional({ description: '类型名称' })
  typeName?: string;
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchResultDto], description: '搜索结果列表（聚合多个视频源）' })
  results!: SearchResultDto[];
}

class BatchUpdateSourceGroupDto {
  @ApiProperty({ description: '视频源标识' })
  sourceId!: string;

  @ApiProperty({ type: [String], description: '该源下的视频 ID 列表' })
  sourceVideoIds!: string[];
}

export class BatchUpdateRequestDto {
  @ApiProperty({ type: [BatchUpdateSourceGroupDto], description: '按源分组的视频 ID 列表' })
  sourceGroups!: BatchUpdateSourceGroupDto[];
}

class BatchUpdateResultDto {
  @ApiProperty({ description: '视频源标识' })
  sourceId!: string;

  @ApiProperty({ description: '视频 ID' })
  sourceVideoId!: string;

  @ApiPropertyOptional({ description: '更新后的总集数' })
  totalEpisodes!: number | null;
}

export class BatchUpdateResponseDto {
  @ApiProperty({ type: [BatchUpdateResultDto], description: '更新结果列表' })
  results!: BatchUpdateResultDto[];
}
