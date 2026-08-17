export interface Episode {
  episodeTitle: string;
  episodeUrl: string;
  episodeIndex: number;
}

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

export interface SearchGroup {
  name: string;
  items: SearchResult[];
}

/** 视频信息（读侧）：包含数据库自增主键 `id`，封面 / 年份 / 总集数允许为 `null`。 */
export interface VideoInfo {
  id: number;
  title: string;
  sourceId: string;
  sourceVideoId: string;
  sourceName: string;
  cover: string | null;
  year: string | null;
  totalEpisodes: number | null;
}

/**
 * 视频信息（写侧）：用于新增 / 更新收藏 / 播放记录等写入类 API 的入参。
 *
 * 约定：不携带 `id` —— 该字段是数据库自增主键，由服务端按业务键 `(sourceId, sourceVideoId)` 解析。
 * `cover / year / totalEpisodes` 沿用读侧类型（允许 `null`），由 hook 端用 `?? ''` / `?? 0` 兜底，
 * 与后端 Zod 的默认行为一致。
 */
export type VideoInfoInput = Omit<VideoInfo, 'id'>;

export interface Favorite {
  id: number;
  updatedAt: number;
  video: VideoInfo;
}

export interface PlayRecord {
  id: number;
  episodeIndex: number | null;
  updatedAt: number;
  video: VideoInfo;
}

/** 新增收藏的入参。 */
export interface AddFavoriteInput {
  video: VideoInfoInput;
}

/** 写入 / 更新播放记录的入参。 */
export interface UpsertPlayRecordInput {
  video: VideoInfoInput;
  episodeIndex: number;
}

export interface SearchHistoryItem {
  keyword: string;
  createdAt: number;
}
