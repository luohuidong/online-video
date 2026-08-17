import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  items: ToastItem[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;
const AUTO_DISMISS_MS = 1800;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  show: (message, variant = 'info') => {
    const id = ++nextId;
    set((s) => ({ items: [...s.items, { id, message, variant }] }));
    window.setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/**
 * 非 hook 形式：可直接在事件回调中调用，无需订阅 store。
 * 与 useToastStore.getState().show 等价。
 */
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  info: (message: string) => useToastStore.getState().show(message, 'info'),
};
