import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HlsPlayer } from '../components/HlsPlayer';
import styles from './PlayerPage.module.scss';

const DEFAULT_TITLE = '在线视频';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url') ?? '';
  const title = searchParams.get('title') ?? '';
  const episode = searchParams.get('episode') ?? '';

  useEffect(() => {
    const previousTitle = document.title;
    const formatted =
      title && episode ? `${title}-${episode}` : title || DEFAULT_TITLE;
    document.title = formatted;
    return () => {
      document.title = previousTitle;
    };
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
