import { z } from 'zod';

export const SourceSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  api: z.url(),
});

export const AppConfigSchema = z.object({
  sources: z.array(SourceSchema),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type Source = z.infer<typeof SourceSchema>;
