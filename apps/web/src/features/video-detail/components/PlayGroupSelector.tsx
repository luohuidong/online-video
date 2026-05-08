interface PlayGroupSelectorProps {
  videoPlayGroups: [string, string][][];
  activeLine: number;
  onSelect: (idx: number) => void;
}

export function PlayGroupSelector({
  videoPlayGroups,
  activeLine,
  onSelect,
}: PlayGroupSelectorProps) {
  return (
    <div className="flex gap-2">
      {videoPlayGroups.map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`px-3 py-1 rounded text-sm transition-colors min-w-[80px] text-center ${
            i === activeLine
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          播放组{i + 1}
        </button>
      ))}
    </div>
  );
}