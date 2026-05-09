import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';

export function useHlsPlayer(url: string) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls | null = null;

    const player = new Plyr(video, {
      settings: ['speed'],
      speed: { selected: 1, options: [0.5, 1, 1.5, 2, 3] },
      keyboard: { focused: true, global: true },
      seekTime: 10,
    });

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => {
      hls?.destroy();
      player.destroy();
    };
  }, [url]);

  return videoRef;
}
