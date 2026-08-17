import { Link, useLocation } from 'react-router-dom';
import styles from './Nav.module.scss';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface NavProps {
  items: NavItem[];
  hoveredPath: string | null;
  onHover: (path: string | null) => void;
}

export function Nav({ items, hoveredPath, onHover }: NavProps) {
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const isHovered = hoveredPath === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={styles.link}
            onMouseEnter={() => onHover(item.path)}
            onMouseLeave={() => onHover(null)}
          >
            <div
              className={`${styles.iconButton} ${
                isActive
                  ? styles.iconButtonActive
                  : `${styles.iconButtonInactive} ${
                      isHovered && !isActive ? styles.iconButtonScaled : ''
                    }`
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
            </div>

            <div
              className={`${styles.tooltip} ${
                isHovered ? styles.tooltipVisible : styles.tooltipHidden
              }`}
            >
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
