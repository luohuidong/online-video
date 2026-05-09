import { useSearchParams } from 'react-router-dom';
import { HlsPlayer } from '../components/HlsPlayer';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url') ?? '';

  if (!url) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-gray-400">
        缺少播放地址
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black">
      <HlsPlayer url={url} />
    </div>
  );
}
