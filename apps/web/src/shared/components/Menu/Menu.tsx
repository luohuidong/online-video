import styles from './Menu.module.scss';
import { MenuContext } from './MenuContext';
import { type MenuAnchor, useMenu } from './useMenu';

interface MenuProps {
  open: boolean;
  onClose: () => void;
  anchor: MenuAnchor;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * 共享菜单容器：自管定位与关闭。业务层只需提供 anchor / open / onClose。
 */
export function Menu({
  open,
  onClose,
  anchor,
  ariaLabel,
  children,
}: MenuProps) {
  const { menuRef, positioned } = useMenu({ anchor, open, onClose });

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={styles.menu}
      style={{ visibility: positioned ? 'visible' : 'hidden' }}
    >
      <MenuContext.Provider value={{ close: onClose }}>
        {children}
      </MenuContext.Provider>
    </div>
  );
}
