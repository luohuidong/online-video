import { toast } from '@/shared/toast';
import { copyTextToClipboard } from '@/shared/utils/video';
import { buildFfmpegDownloadCommand } from '../../utils/video';
import { EpisodeMenuItem } from './EpisodeMenuItem';
import { useEpisodeContextMenu } from './useEpisodeContextMenu';

interface EpisodeContextMenuProps {
  x: number;
  y: number;
  episodeUrl: string;
  episodeLabel: string;
  videoTitle: string;
  onClose: () => void;
}

export function EpisodeContextMenu({
  x,
  y,
  episodeUrl,
  episodeLabel,
  videoTitle,
  onClose,
}: EpisodeContextMenuProps) {
  const { menuRef } = useEpisodeContextMenu({ x, y, onClose });

  const copy = async (text: string, successMsg: string) => {
    try {
      await copyTextToClipboard(text);
      toast.success(successMsg);
    } catch {
      toast.error('复制失败');
    } finally {
      onClose();
    }
  };

  const handleCopyUrl = () => copy(episodeUrl, '已复制 m3u8 链接');

  const handleCopyFfmpegCommand = () =>
    copy(
      buildFfmpegDownloadCommand(episodeUrl, videoTitle, episodeLabel),
      '已复制 FFmpeg 下载命令',
    );

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`第 ${episodeLabel} 集操作菜单`}
      style={{ position: 'fixed', left: x, top: y }}
      className="z-50 min-w-50 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 py-1 text-sm"
    >
      <EpisodeMenuItem
        onClick={handleCopyUrl}
        ariaLabel={`复制第 ${episodeLabel} 集的 m3u8 链接`}
      >
        复制 m3u8 链接
      </EpisodeMenuItem>
      <hr className="my-1 border-0 h-px bg-gray-200 dark:bg-gray-700" />
      <EpisodeMenuItem
        onClick={handleCopyFfmpegCommand}
        ariaLabel={`复制第 ${episodeLabel} 集的 FFmpeg 下载命令`}
      >
        复制 FFmpeg 下载命令
      </EpisodeMenuItem>
    </div>
  );
}
