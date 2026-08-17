import type { Episode } from '@/shared/types';

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

export function isM3u8Url(url: string): boolean {
  return url.includes('.m3u8');
}

export function isM3u8Group(
  group: readonly Episode[] | undefined,
): boolean {
  return !!group?.some((ep) => isM3u8Url(ep.episodeUrl));
}

export function buildFfmpegDownloadCommand(
  episodeUrl: string,
  title: string,
  episodeLabel: string,
): string {
  // 文件名模板：视频名称-集数.mp4
  const safeTitle = sanitizeFilename(title);
  const safeEpisode = sanitizeFilename(episodeLabel);
  const filename = `${safeTitle}-${safeEpisode}.mp4`;
  return `ffmpeg -i "${episodeUrl}" -c copy ${filename}`;
}

/**
 * 将字符串清理为可作为文件名的形式：替换 Windows / POSIX 下的非法字符并去除首尾空白。
 * 不限制 Unicode（CJK 仍保留）。
 */
function sanitizeFilename(input: string): string {
  return input.replace(/[\\/:*?"<>|]/g, '_').trim();
}
