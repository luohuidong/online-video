import { isM3u8Group } from '../utils/video';

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
    <div className="flex gap-2 flex-wrap">
      {videoPlayGroups.map((group, i) => {
        const isM3u8 = isM3u8Group(group);
        return (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={`px-3 py-1 rounded text-sm transition-colors min-w-20 text-center cursor-pointer ${
                i === activeLine
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              播放组{i + 1}
            </button>
            {isM3u8 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] leading-none px-1 py-0.5 rounded">
                m3u8
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
