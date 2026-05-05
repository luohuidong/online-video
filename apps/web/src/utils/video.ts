export function getVideoEpisodeCount(videoPlayGroups: [string, string][][]): number {
  return videoPlayGroups[0]?.length ?? 0;
}