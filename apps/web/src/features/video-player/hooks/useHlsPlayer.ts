import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface Selector {
  html: string;
  value?: string | number;
  default?: boolean;
}

const PLAYBACK_RATE_KEY = 'player:playbackRate';

const PLAYBACK_RATE_OPTIONS: Omit<Selector, 'default'>[] = [
  { html: '3.0x', value: 3.0 },
  { html: '2.0x', value: 2.0 },
  { html: '1.75x', value: 1.75 },
  { html: '1.5x', value: 1.5 },
  { html: '1.25x', value: 1.25 },
  { html: '1.0x', value: 1.0 },
  { html: '0.75x', value: 0.75 },
  { html: '0.5x', value: 0.5 },
];

function getSavedPlaybackRate(): number {
  const saved = localStorage.getItem(PLAYBACK_RATE_KEY);
  if (saved !== null) {
    const rate = parseFloat(saved);
    if (PLAYBACK_RATE_OPTIONS.some((o) => o.value === rate)) return rate;
  }
  return 1.0;
}

function buildPlaybackRateSelectors(savedRate: number): Selector[] {
  return PLAYBACK_RATE_OPTIONS.map((o) => ({
    ...o,
    default: o.value === savedRate,
  }));
}

export function useHlsPlayer(url: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return;

    const savedRate = getSavedPlaybackRate();

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
          html: `${savedRate}x`,
          selector: buildPlaybackRateSelectors(savedRate),
          onSelect(item) {
            const rate = item.value as number;
            art.playbackRate = rate;
            localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
            return item.html;
          },
        },
      ],
    });

    art.on('ready', () => {
      if (savedRate !== 1.0) {
        art.playbackRate = savedRate;
      }
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
