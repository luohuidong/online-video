import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  buildFfmpegDownloadScript,
  isM3u8Url,
} from '@/features/video-detail/utils/video';
import { Menu, MenuItem } from '@/shared/components/Menu';
import { toast } from '@/shared/toast';
import type { Episode } from '@/shared/types';
import { copyTextToClipboard } from '@/shared/utils/video';
import styles from './OperationsMenu.module.scss';

interface OperationsMenuProps {
  currentPlayGroup: readonly Episode[];
  videoTitle: string;
  /** 上次观看的 episodeIndex；-1 表示无播放记录（视为全部未观看）。 */
  lastWatchedIdx: number;
  /** 当前播放组不是 m3u8 时整体不渲染。 */
  isCurrentGroupM3u8: boolean;
}

export function OperationsMenu({
  currentPlayGroup,
  videoTitle,
  lastWatchedIdx,
  isCurrentGroupM3u8,
}: OperationsMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!isCurrentGroupM3u8) return null;

  const m3u8Episodes = currentPlayGroup.filter((ep) =>
    isM3u8Url(ep.episodeUrl),
  );
  // lastWatchedIdx 为 -1 时阈值取 -1，使 episodeIndex > -1 全命中，符合"无记录视为全部未观看"。
  const threshold = lastWatchedIdx >= 0 ? lastWatchedIdx : -1;
  const unwatchedEpisodes = m3u8Episodes.filter(
    (ep) => ep.episodeIndex > threshold,
  );
  const hasUnwatched = unwatchedEpisodes.length > 0;

  const copy = async (text: string, successMsg: string) => {
    try {
      await copyTextToClipboard(text);
      toast.success(successMsg);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleCopyAll = () =>
    copy(
      buildFfmpegDownloadScript(m3u8Episodes, videoTitle),
      `已复制 ${m3u8Episodes.length} 个剧集的下载脚本`,
    );

  const handleCopyUnwatched = () =>
    copy(
      buildFfmpegDownloadScript(unwatchedEpisodes, videoTitle),
      `已复制 ${unwatchedEpisodes.length} 个未观看剧集的下载脚本`,
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        操作
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
      <Menu
        anchor={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="批量下载操作"
      >
        <MenuItem onSelect={handleCopyAll}>复制下载所有视频的脚本</MenuItem>
        {hasUnwatched && (
          <MenuItem onSelect={handleCopyUnwatched}>
            复制下载未观看视频的脚本
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
