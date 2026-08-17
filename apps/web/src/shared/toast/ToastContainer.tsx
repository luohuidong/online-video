import styles from './ToastContainer.module.scss';
import { useToastStore } from './toast-store';

const VARIANT_CLASSES = {
  success: styles.variantSuccess,
  error: styles.variantError,
  info: styles.variantInfo,
} as const;

export function ToastContainer() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (items.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className={styles.container}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`${styles.item} ${VARIANT_CLASSES[t.variant]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
