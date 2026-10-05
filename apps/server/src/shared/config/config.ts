import { type AppConfig, AppConfigSchema, type Source } from './schema';

let cached: AppConfig | null = null;
// Collapse concurrent first calls into a single load.
let pending: Promise<AppConfig> | null = null;

async function loadConfig(): Promise<AppConfig> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const configPath = `${process.cwd()}/config.yml`;
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const raw = Bun.YAML.parse(await file.text());
    const result = AppConfigSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    cached = result.data;
    console.log(
      `[config] loaded ${cached.sources.length} source(s) from ${configPath}`,
    );
    return cached;
  })();

  return pending;
}

/**
 * Returns the configured video sources. Loads and caches the YAML on first
 * call — keeps the module body fully synchronous so module evaluation
 * order is deterministic (no async top-level work racing with sibling
 * imports' setup side effects).
 */
export async function getSources(): Promise<Source[]> {
  const c = await loadConfig();
  return c.sources;
}
