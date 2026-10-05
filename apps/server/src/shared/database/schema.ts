import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// 视频主表 - 存视频的元信息
export const videos = sqliteTable(
  'videos',
  {
    id: integer('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceVideoId: text('source_video_id').notNull(),
    title: text('title').notNull(),
    sourceName: text('source_name').notNull(),
    cover: text('cover'),
    year: text('year'),
    totalEpisodes: integer('total_episodes'),
  },
  (t) => [
    uniqueIndex('videos_source_video_idx').on(t.sourceId, t.sourceVideoId),
  ],
);

// 收藏表 - 只存收藏行为相关
export const favorites = sqliteTable(
  'favorites',
  {
    id: integer('id').primaryKey(),
    videoId: integer('video_id')
      .notNull()
      .references(() => videos.id),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [uniqueIndex('favorites_video_idx').on(t.videoId)],
);

// 播放记录表 - 只存播放相关
export const playRecords = sqliteTable(
  'play_records',
  {
    id: integer('id').primaryKey(),
    videoId: integer('video_id')
      .notNull()
      .references(() => videos.id),
    episodeIndex: integer('episode_index'),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [uniqueIndex('play_records_video_idx').on(t.videoId)],
);
