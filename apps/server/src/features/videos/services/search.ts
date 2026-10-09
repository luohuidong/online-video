import { config } from '../../../shared/config/index.ts';
import type { SearchGroup } from '../types.ts';
import { searchSource } from './utils/scraper.ts';

export async function search(query: string): Promise<SearchGroup[]> {
  const sources = await config.getSources();
  const maxPages = 5;
  const perSource = await Promise.all(
    sources.map((src) => searchSource(src, query, maxPages)),
  );

  // 按 config.yml 中的源顺序分组，跳过空集合
  return sources
    .map((src, i) => ({ source: src, items: perSource[i] ?? [] }))
    .filter((g) => g.items.length > 0)
    .map((g) => ({ name: g.source.sourceName, items: g.items }));
}
