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

export const AddFavoriteSchema = z.object({
  video: VideoInfoInputSchema,
});

export type AddFavoriteInput = z.infer<typeof AddFavoriteSchema>;

interface VideoInfo {
  id: number;
  title: string;
  sourceId: string;
  sourceVideoId: string;
  sourceName: string;
  cover: string | null;
  year: string | null;
  totalEpisodes: number | null;
}

export interface FavoriteRecord {
  id: number;
  updatedAt: number;
  video: VideoInfo;
}
