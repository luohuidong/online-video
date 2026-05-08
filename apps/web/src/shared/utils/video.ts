export function getVideoEpisodeCount(videoPlayGroups: [string, string][][]): number {
  return videoPlayGroups[0]?.length ?? 0;
}

export function proxyImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
