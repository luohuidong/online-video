import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
  (t) => [uniqueIndex('videos_source_video_idx').on(t.sourceId, t.sourceVideoId)],
);

// 收藏表 - 只存收藏行为相关
export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey(), // 自增主键
  videoId: integer('video_id')
    .notNull()
    .references(() => videos.id), // 关联视频
  updatedAt: integer('updated_at').notNull(), // 更新时间戳
});

// 播放记录表 - 只存播放相关
export const playRecords = sqliteTable('play_records', {
  id: integer('id').primaryKey(), // 自增主键
  videoId: integer('video_id')
    .notNull()
    .references(() => videos.id), // 关联视频
  episodeIndex: integer('episode_index'), // 当前播放集数
  updatedAt: integer('updated_at').notNull(), // 更新时间戳
});
