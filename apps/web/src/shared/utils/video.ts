export function getVideoEpisodeCount(
  videoPlayGroups: [string, string][][],
): number {
  return videoPlayGroups[0]?.length ?? 0;
}

export function proxyImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to legacy fallback
    }
  }
  // 兜底：用于非安全上下文 / 部分嵌入式 WebView
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}
