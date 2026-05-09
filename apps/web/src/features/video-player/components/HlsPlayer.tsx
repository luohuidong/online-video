import 'plyr/dist/plyr.css';
import { useHlsPlayer } from '../hooks/useHlsPlayer';

interface HlsPlayerProps {
  url: string;
}

export function HlsPlayer({ url }: HlsPlayerProps) {
  const videoRef = useHlsPlayer(url);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain"
      playsInline
    />
  );
}
