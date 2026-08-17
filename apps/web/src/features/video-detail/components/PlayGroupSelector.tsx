import type { Episode } from '@/shared/types';
import { isM3u8Group } from '../utils/video';
import styles from './PlayGroupSelector.module.scss';

interface PlayGroupSelectorProps {
  videoPlayGroups: Episode[][];
  activeLine: number;
  onSelect: (idx: number) => void;
}

export function PlayGroupSelector({
  videoPlayGroups,
  activeLine,
  onSelect,
}: PlayGroupSelectorProps) {
  return (
    <div className={styles.list}>
      {videoPlayGroups.map((group, i) => {
        const isM3u8 = isM3u8Group(group);
        return (
          <div key={i} className={styles.item}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={`${styles.button} ${
                i === activeLine ? styles.buttonActive : ''
              }`}
            >
              播放组{i + 1}
            </button>
            {isM3u8 && <span className={styles.badge}>m3u8</span>}
          </div>
        );
      })}
    </div>
  );
}
