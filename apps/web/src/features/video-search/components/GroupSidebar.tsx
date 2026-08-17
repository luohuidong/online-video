import type { SearchGroup } from '@/shared/types';
import styles from './GroupSidebar.module.scss';

interface GroupSidebarProps {
  groups: SearchGroup[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function GroupSidebar({
  groups,
  activeIndex,
  onSelect,
}: GroupSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <h3 className={styles.heading}>数据源</h3>
        <ul className={styles.list}>
          {groups.map((group, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={group.name}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`${styles.button} ${
                    isActive ? styles.buttonActive : ''
                  }`}
                >
                  <span className={styles.name}>{group.name}</span>
                  <span
                    className={`${styles.count} ${
                      isActive ? styles.countActive : styles.countInactive
                    }`}
                  >
                    {group.items.length} 条
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
