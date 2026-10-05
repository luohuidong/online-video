import { z } from 'zod';

const VideoInfoInputSchema = z.object({
  sourceId: z.string().min(1),
  sourceVideoId: z.string().min(1),
  title: z.string().min(1),
  sourceName: z.string().min(1),
  cover: z.string().optional().default(''),
  year: z.string().optional().default(''),
  totalEpisodes: z.number().int().nonnegative().optional().default(0),
});

export const UpsertPlayRecordSchema = z.object({
  video: VideoInfoInputSchema,
  episodeIndex: z.number().int().nonnegative().optional().default(0),
});

export type UpsertPlayRecordInput = z.infer<typeof UpsertPlayRecordSchema>;

interface VideoInfo {
  id: number;
  title: string;
  sourceId: string;
  sourceName: string;
  sourceVideoId: string;
  cover: string | null;
  year: string | null;
  totalEpisodes: number | null;
}

export interface PlayRecord {
  id: number;
  episodeIndex: number | null;
  updatedAt: number;
  video: VideoInfo;
}
