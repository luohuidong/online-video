interface EpisodeMenuItemProps {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

export function EpisodeMenuItem({
  onClick,
  ariaLabel,
  children,
}: EpisodeMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-full text-left px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
    >
      {children}
    </button>
  );
}
