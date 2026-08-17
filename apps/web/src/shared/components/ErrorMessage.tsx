import styles from './ErrorMessage.module.scss';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = '加载失败，请稍后重试',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retry}>
          重试
        </button>
      )}
    </div>
  );
}
