/** 单集视频条目 */
export interface Episode {
  episodeTitle: string;
  episodeUrl: string;
  episodeIndex: number;
}

/** 视频搜索结果 */
export interface SearchResult {
  sourceVideoId: string;
  title: string;
  poster: string;
  videoPlayGroups: Episode[][];
  sourceId: string;
  sourceName: string;
  year: string;
  desc?: string;
  typeName?: string;
}

/** 按数据源分组的搜索结果 */
export interface SearchGroup {
  name: string;
  items: SearchResult[];
}

/** 数据源返回的原始视频条目 */
export interface ApiVideoItem {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_play_url?: string;
  vod_year?: string;
  vod_content?: string;
  type_name?: string;
}

/** 数据源列表接口的响应体 */
export interface ApiListResponse {
  list: ApiVideoItem[];
  pagecount?: number;
}

/** 视频数据源配置 */
export interface SourceConfig {
  sourceId: string;
  sourceName: string;
  api: string;
}

export class SourceNotFoundError extends Error {
  // 注意：Node 的 type stripping 不支持构造函数参数属性（`constructor(public …)`），
  // 所以字段必须显式声明并赋值。
  readonly sourceId: string;

  constructor(sourceId: string) {
    super(`Source not found: ${sourceId}`);
    this.name = 'SourceNotFoundError';
    this.sourceId = sourceId;
  }
}

export class UpstreamError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'UpstreamError';
    this.cause = cause;
  }
}
