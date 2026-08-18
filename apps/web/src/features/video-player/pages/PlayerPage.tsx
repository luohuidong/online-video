import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HlsPlayer } from '../components/HlsPlayer';
import styles from './PlayerPage.module.scss';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url') ?? '';
  const title = searchParams.get('title') ?? '';
  const episode = searchParams.get('episode') ?? '';

  useEffect(() => {
    const videoTitle = title && episode ? `${title}-${episode}` : title;
    document.title = videoTitle ? `视频-播放-${videoTitle}` : '视频-播放';
  }, [title, episode]);

  if (!url) {
    return <div className={styles.missing}>缺少播放地址</div>;
  }

  return (
    <div className={styles.player}>
      <HlsPlayer url={url} />
    </div>
  );
}
