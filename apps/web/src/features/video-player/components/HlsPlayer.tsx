import { useHlsPlayer } from '../hooks/useHlsPlayer';
import styles from './HlsPlayer.module.scss';

interface HlsPlayerProps {
  url: string;
}

export function HlsPlayer({ url }: HlsPlayerProps) {
  const containerRef = useHlsPlayer(url);

  return <div ref={containerRef} className={styles.container} />;
}
