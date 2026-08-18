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

export function isM3u8Group(group: readonly Episode[] | undefined): boolean {
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
 * 为当前播放组生成批量下载的 bash 脚本：使用 `urls` / `names` 两个并行数组
 * 加 `for` 循环逐集调用 ffmpeg。
 *
 * - 仅保留 m3u8 剧集；非 m3u8 剧集会被跳过（ffmpeg `-c copy` 需要 HLS 源）
 * - 文件名与单集命令保持同一模板（`${title}-${episode}.mp4`，经 sanitizeFilename 处理）
 * - 若过滤后没有可下载项，返回空字符串（调用方决定是否提示用户）
 */
export function buildFfmpegDownloadScript(
  episodes: readonly Episode[],
  videoTitle: string,
): string {
  const urls: string[] = [];
  const names: string[] = [];
  for (const ep of episodes) {
    if (!isM3u8Url(ep.episodeUrl)) continue;
    urls.push(`  "${ep.episodeUrl}"`);
    const filename = `${sanitizeFilename(videoTitle)}-${sanitizeFilename(ep.episodeTitle)}.mp4`;
    names.push(`  "${filename}"`);
  }
  if (urls.length === 0) return '';

  return [
    '#!/bin/bash',
    'set -e',
    '',
    'urls=(',
    ...urls,
    ')',
    '',
    'names=(',
    ...names,
    ')',
    '',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: bash syntax inside emitted script
    'for i in "${!urls[@]}"; do',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: bash syntax inside emitted script
    '  ffmpeg -i "${urls[$i]}" -c copy "${names[$i]}"',
    'done',
    '',
  ].join('\n');
}

/**
 * 将字符串清理为可作为文件名的形式：替换 Windows / POSIX 下的非法字符并去除所有空白。
 * 不限制 Unicode（CJK 仍保留）。
 */
export function sanitizeFilename(input: string): string {
  return input
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '')
    .trim();
}
