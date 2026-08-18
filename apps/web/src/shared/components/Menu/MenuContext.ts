import { createContext } from 'react';

/**
 * 菜单上下文：让 MenuItem 在被选中后能自动关闭所在 Menu。
 * Menu 通过 Provider 注入 close 回调，MenuItem 通过 useContext 读取。
 */
export interface MenuContextValue {
  close: () => void;
}

export const MenuContext = createContext<MenuContextValue | null>(null);
