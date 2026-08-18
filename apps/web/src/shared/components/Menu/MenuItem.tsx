import { useContext } from 'react';
import { MenuContext } from './MenuContext';
import styles from './MenuItem.module.scss';

interface MenuItemProps {
  /** 选中时的回调；菜单会在调用后自动关闭。 */
  onSelect: () => void | Promise<void>;
  /** 禁用状态：仅展示文本，不响应点击，菜单不会自动关闭。 */
  disabled?: boolean;
  children: React.ReactNode;
}

export function MenuItem({ onSelect, disabled, children }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={
        disabled
          ? undefined
          : () => {
              onSelect();
              ctx?.close();
            }
      }
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={styles.item}
    >
      {children}
    </button>
  );
}
