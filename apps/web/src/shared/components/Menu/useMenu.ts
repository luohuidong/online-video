import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const VIEWPORT_PADDING = 8;
const GAP = 8;

/**
 * 锚定方式：
 * - RefObject：锚到触发元素的 DOMRect（按钮下拉菜单）
 * - { x, y }：锚到屏幕坐标（右键弹层菜单）
 */
export type MenuAnchor =
  | React.RefObject<HTMLElement | null>
  | { x: number; y: number };

interface UseMenuOptions {
  anchor: MenuAnchor;
  open: boolean;
  onClose: () => void;
}

interface UseMenuResult {
  menuRef: React.RefObject<HTMLDivElement | null>;
  /** 首次定位完成后置 true；用于首帧 `visibility: hidden` 抑制闪烁。 */
  positioned: boolean;
}

function isPointAnchor(anchor: MenuAnchor): anchor is { x: number; y: number } {
  return (
    typeof anchor === 'object' &&
    anchor !== null &&
    !('current' in anchor) &&
    typeof (anchor as { x?: unknown }).x === 'number' &&
    typeof (anchor as { y?: unknown }).y === 'number'
  );
}

/**
 * 统一的菜单定位与关闭行为：
 * - RefObject anchor：默认按钮下方 8px、右对齐；视口下边距不足 → 翻到按钮上方
 * - 点 anchor：原坐标；视口右/下边距不足 → 向左/上偏移夹紧到 VIEWPORT_PADDING
 * - 外部点击 / Esc / 滚动 / 窗口尺寸变化 都会触发 onClose
 * - RefObject anchor 模式下，点击触发元素本身不会关闭菜单（避免闪烁）
 */
export function useMenu({
  anchor,
  open,
  onClose,
}: UseMenuOptions): UseMenuResult {
  const menuRef = useRef<HTMLDivElement>(null);
  const [positioned, setPositioned] = useState(false);

  // 视口边界保护 + 定位
  useLayoutEffect(() => {
    if (!open) {
      setPositioned(false);
      return;
    }
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const menuRect = menuEl.getBoundingClientRect();

    if (isPointAnchor(anchor)) {
      let left = anchor.x;
      let top = anchor.y;
      if (menuRect.right > window.innerWidth) {
        left = Math.max(VIEWPORT_PADDING, anchor.x - menuRect.width);
      }
      if (menuRect.bottom > window.innerHeight) {
        top = Math.max(VIEWPORT_PADDING, anchor.y - menuRect.height);
      }
      menuEl.style.top = `${top}px`;
      menuEl.style.left = `${left}px`;
    } else {
      const triggerEl = anchor.current;
      if (!triggerEl) return;
      const triggerRect = triggerEl.getBoundingClientRect();

      let top = triggerRect.bottom + GAP;
      let left = triggerRect.right - menuRect.width;

      if (top + menuRect.height > window.innerHeight - VIEWPORT_PADDING) {
        top = triggerRect.top - menuRect.height - GAP;
      }
      top = Math.max(VIEWPORT_PADDING, top);

      if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
      if (left + menuRect.width > window.innerWidth - VIEWPORT_PADDING) {
        left = window.innerWidth - menuRect.width - VIEWPORT_PADDING;
      }

      menuEl.style.top = `${top}px`;
      menuEl.style.left = `${left}px`;
    }
    setPositioned(true);
  }, [open, anchor]);

  // 外部点击 / Esc / 滚动 / 窗口尺寸变化 → 关闭
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      // RefObject anchor：点击触发元素本身不算外部点击，避免闪烁
      if (!isPointAnchor(anchor) && anchor.current?.contains(target)) return;
      onClose();
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
  }, [open, onClose, anchor]);

  return { menuRef, positioned };
}
