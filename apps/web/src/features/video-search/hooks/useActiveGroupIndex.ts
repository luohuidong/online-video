import { useEffect, useState } from 'react';

/**
 * 跟踪搜索结果页中当前可见的分组 section，并返回对应的索引。
 *
 * - `query` 切换时重置为 0。
 * - 通过 `IntersectionObserver` 监听所有 `group-{i}` section，将处于视口上 1/3 触发带内的最小索引用作当前激活分组。
 */
export function useActiveGroupIndex(groupCount: number, query: string): number {
  const [activeIndex, setActiveIndex] = useState(0);

  // 切换关键词时重置高亮
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // 根据可见分组更新高亮
  useEffect(() => {
    if (groupCount === 0) return;

    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number(
            (entry.target as HTMLElement).id.replace('group-', ''),
          );
          if (entry.isIntersecting) visible.add(idx);
          else visible.delete(idx);
        }
        if (visible.size > 0) {
          setActiveIndex(Math.min(...visible));
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    for (let i = 0; i < groupCount; i++) {
      const el = document.getElementById(`group-${i}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [groupCount]);

  return activeIndex;
}
