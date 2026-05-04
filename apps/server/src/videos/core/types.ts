/** 视频搜索结果 */
export interface SearchResult {
  /** 视频在数据源中的 ID */
  sourceVideoId: string;
  /** 视频标题 */
  title: string;
  /** 封面图片 URL */
  poster: string;
  /** 剧集播放组 */
  videoPlayGroups: Array<[string, string][]>;
  /** 所属数据源的 key */
  sourceId: string;
  /** 所属数据源的名称 */
  sourceName: string;
  /** 发行年份 */
  year: string;
  /** 视频简介 */
  desc?: string;
  /** 视频类型名称（如电影、电视剧） */
  typeName?: string;
}

/** 数据源返回的原始视频条目 */
export interface ApiVideoItem {
  /** 视频唯一标识 */
  vod_id: string | number;
  /** 视频名称 */
  vod_name: string;
  /** 封面图片 URL */
  vod_pic: string;
  /** 播放地址（含多集信息） */
  vod_play_url?: string;
  /** 发行年份 */
  vod_year?: string;
  /** 视频简介 */
  vod_content?: string;
  /** 视频类型名称 */
  type_name?: string;
}

/** 数据源列表接口的响应体 */
export interface ApiListResponse {
  /** 视频条目列表 */
  list: ApiVideoItem[];
  /** 总页数 */
  pagecount?: number;
}

/** 视频数据源配置 */
export interface SourceConfig {
  /** 数据源唯一标识 */
  sourceId: string;
  /** 数据源显示名称 */
  sourceName: string;
  /** 数据源 API 地址 */
  api: string;
}
