import { useHlsPlayer } from '../hooks/useHlsPlayer';

interface HlsPlayerProps {
  url: string;
}

export function HlsPlayer({ url }: HlsPlayerProps) {
  const containerRef = useHlsPlayer(url);

  return <div ref={containerRef} className="w-full h-full" />;
}
