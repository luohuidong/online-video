import { useHlsPlayer } from '../hooks/useHlsPlayer';

interface HlsPlayerProps {
  url: string;
}

export function HlsPlayer({ url }: HlsPlayerProps) {
  const containerRef = useHlsPlayer(url);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
