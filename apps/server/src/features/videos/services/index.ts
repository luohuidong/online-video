// Barrel for the videos services layer. Exports the public API consumed
// by sibling files outside services/ (routes.ts, feature/index.ts).
// Internal helpers like searchSource / getDetailFromSource are
// implementation details — sibling service files import them directly
// from ./utils/scraper instead of going through this barrel.
export { batchUpdate } from './batch-update.ts';
export { getDetail } from './detail.ts';
export { search } from './search.ts';
