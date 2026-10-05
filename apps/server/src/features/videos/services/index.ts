// Barrel for the videos services layer. Exports the public API consumed
// by sibling files outside services/ (routes.ts, feature/index.ts).
// Internal helpers like searchSource / getDetailFromSource are
// implementation details — sibling service files import them directly
// from ./utils/scraper instead of going through this barrel.
//
// ./refresh is imported for its side effect (registers a daily Bun.cron
// at module load) rather than for any binding. The cycle it would
// otherwise form (refresh.ts needs batchUpdate from here) is broken by
// having refresh.ts import batchUpdate from ./batch-update directly.
import './refresh';

export { batchUpdate } from './batch-update';
export { getDetail } from './detail';
export { search } from './search';
