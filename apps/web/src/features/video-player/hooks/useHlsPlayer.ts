import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

function playM3u8(video: HTMLVideoElement, url: string, art: Artplayer) {
  if (Hls.isSupported()) {
    if (art.hls) (art.hls as Hls).destroy();
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    art.hls = hls;
    art.on('destroy', () => hls.destroy());
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    art.notice.show = 'Unsupported playback format: m3u8';
  }
}

Artplayer.PLAYBACK_RATE = [0.5, 1, 1.5, 2, 3];

export function useHlsPlayer(url: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    const art = new Artplayer({
      container: containerRef.current,
      url,
      type: 'm3u8',
      customType: { m3u8: playM3u8 },
      fullscreen: true,
      autoOrientation: true,
      playbackRate: true,
      setting: true,
      fastForward: true,
      lock: true,
    });

    return () => {
      art.destroy(false);
    };
  }, [url]);

  return containerRef;
}
