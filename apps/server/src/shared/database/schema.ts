import {
  bigint,
  int,
  mysqlTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// 视频主表 - 存视频的元信息
export const videos = mysqlTable(
  'videos',
  {
    id: int('id').primaryKey().autoincrement(),
    sourceId: varchar('source_id', { length: 64 }).notNull(),
    sourceVideoId: varchar('source_video_id', { length: 64 }).notNull(),
    title: varchar('title', { length: 512 }).notNull(),
    sourceName: varchar('source_name', { length: 128 }).notNull(),
    cover: varchar('cover', { length: 1024 }),
    year: varchar('year', { length: 16 }),
    totalEpisodes: int('total_episodes'),
  },
  (t) => [
    uniqueIndex('videos_source_video_idx').on(t.sourceId, t.sourceVideoId),
  ],
);

// 收藏表 - 只存收藏行为相关
export const favorites = mysqlTable(
  'favorites',
  {
    id: int('id').primaryKey().autoincrement(),
    videoId: int('video_id')
      .notNull()
      .references(() => videos.id),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('favorites_video_idx').on(t.videoId)],
);

// 播放记录表 - 只存播放相关
export const playRecords = mysqlTable(
  'play_records',
  {
    id: int('id').primaryKey().autoincrement(),
    videoId: int('video_id')
      .notNull()
      .references(() => videos.id),
    episodeIndex: int('episode_index'),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('play_records_video_idx').on(t.videoId)],
);
