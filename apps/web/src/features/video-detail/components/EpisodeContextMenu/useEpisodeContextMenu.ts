import { useEffect, useLayoutEffect, useRef } from 'react';

const VIEWPORT_PADDING = 8;

interface UseEpisodeContextMenuOptions {
  x: number;
  y: number;
  onClose: () => void;
}

/**
 * 托管右键菜单的定位与关闭行为：
 * - 靠近视口边缘时自动反向偏移
 * - 外部点击 / Esc / 滚动 / 窗口尺寸变化 都会触发 onClose
 */
export function useEpisodeContextMenu({
  x,
  y,
  onClose,
}: UseEpisodeContextMenuOptions) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 视口边界保护：菜单靠近视口边缘时自动反向偏移
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let nextLeft = x;
    let nextTop = y;
    if (rect.right > window.innerWidth) {
      nextLeft = Math.max(VIEWPORT_PADDING, x - rect.width);
    }
    if (rect.bottom > window.innerHeight) {
      nextTop = Math.max(VIEWPORT_PADDING, y - rect.height);
    }
    if (nextLeft !== x || nextTop !== y) {
      el.style.left = `${nextLeft}px`;
      el.style.top = `${nextTop}px`;
    }
  }, [x, y]);

  // 外部点击 / Esc / 滚动 / 窗口尺寸变化 → 关闭
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    const handleResize = () => onClose();

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose]);

  return { menuRef };
}
