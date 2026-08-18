import { Menu, MenuDivider, MenuItem } from '@/shared/components/Menu';
import { toast } from '@/shared/toast';
import { copyTextToClipboard } from '@/shared/utils/video';
import { buildFfmpegDownloadCommand } from '../../utils/video';

interface EpisodeContextMenuProps {
  /** 鼠标右键点击的视口坐标。 */
  anchor: { x: number; y: number };
  episodeUrl: string;
  episodeLabel: string;
  videoTitle: string;
  onClose: () => void;
  /** 复制 FFmpeg 命令成功后触发，用于更新播放记录。 */
  onCopyFfmpegCommand: () => void;
}

export function EpisodeContextMenu({
  anchor,
  episodeUrl,
  episodeLabel,
  videoTitle,
  onClose,
  onCopyFfmpegCommand,
}: EpisodeContextMenuProps) {
  const copy = async (
    text: string,
    successMsg: string,
    onSuccess?: () => void,
  ) => {
    try {
      await copyTextToClipboard(text);
      toast.success(successMsg);
      onSuccess?.();
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <Menu
      anchor={anchor}
      open
      onClose={onClose}
      ariaLabel={`第 ${episodeLabel} 集操作菜单`}
    >
      <MenuItem onSelect={() => copy(episodeUrl, '已复制 m3u8 链接')}>
        复制 m3u8 链接
      </MenuItem>
      <MenuDivider />
      <MenuItem
        onSelect={() =>
          copy(
            buildFfmpegDownloadCommand(episodeUrl, videoTitle, episodeLabel),
            '已复制 FFmpeg 下载命令',
            onCopyFfmpegCommand,
          )
        }
      >
        复制 FFmpeg 下载命令
      </MenuItem>
    </Menu>
  );
}
