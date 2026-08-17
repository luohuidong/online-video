import { useToastStore } from './toast-store';

const VARIANT_CLASSES = {
  success: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
  error: 'bg-red-600 text-white dark:bg-red-500',
  info: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
} as const;

export function ToastContainer() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (items.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex flex-col items-center gap-2 pointer-events-none"
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto animate-toast-in px-3 py-1.5 rounded-md text-sm shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${VARIANT_CLASSES[t.variant]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
