import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface Selector {
  html: string;
  value?: string | number;
  default?: boolean;
}

const PLAYBACK_RATES: Selector[] = [
  { html: '3.0x', value: 3.0 },
  { html: '2.0x', value: 2.0 },
  { html: '1.75x', value: 1.75 },
  { html: '1.5x', value: 1.5 },
  { html: '1.25x', value: 1.25 },
  { html: '1.0x', value: 1.0, default: true },
  { html: '0.75x', value: 0.75 },
  { html: '0.5x', value: 0.5 },
];

export function useHlsPlayer(url: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return;

    const art = new Artplayer({
      container,
      url,
      type: 'm3u8',
      customType: {
        m3u8: (video: HTMLVideoElement, src: string) => {
          if (Hls.isSupported()) {
            hlsRef.current = new Hls();
            hlsRef.current.loadSource(src);
            hlsRef.current.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
          }
        },
      },
      fullscreen: true,
      setting: true,
      hotkey: true,
      pip: true,
      controls: [
        {
          name: 'playbackRate',
          position: 'right',
          html: '1.0x',
          selector: PLAYBACK_RATES,
          onSelect(item) {
            art.playbackRate = item.value as number;
            return item.html;
          },
        },
      ],
    });

    // 退出全屏后触发 resize，修复画面宽高比异常的问题
    art.on('fullscreen', (state: boolean) => {
      if (!state) {
        art.emit('resize');
      }
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      art.destroy(false);
    };
  }, [url]);

  return containerRef;
}
