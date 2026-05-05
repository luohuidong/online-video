export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
}
