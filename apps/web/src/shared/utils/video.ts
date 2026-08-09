export function getVideoEpisodeCount(videoPlayGroups: [string, string][][]): number {
  return videoPlayGroups[0]?.length ?? 0;
}

export function proxyImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function getEpisodeHref(
  episodeUrl: string,
  title: string,
  episodeLabel: string,
): string {
  if (!episodeUrl.includes('.m3u8')) {
    return episodeUrl;
  }
  const params = new URLSearchParams({
    url: episodeUrl,
    title,
    episode: episodeLabel,
  });
  return `/play?${params.toString()}`;
}
