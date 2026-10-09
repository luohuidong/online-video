import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { type AppConfig, AppConfigSchema, type Source } from './schema.ts';

class ConfigService {
  private config: AppConfig | null = null;

  async getSources(): Promise<Source[]> {
    const config = await this.load();
    return config.sources;
  }

  private async load(): Promise<AppConfig> {
    if (this.config) return this.config;

    const configPath = `${process.cwd()}/config.yml`;
    let text: string;
    try {
      text = await readFile(configPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Config file not found: ${configPath}`);
      }
      throw err;
    }
    const raw = parse(text);
    const parsed = AppConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid config: ${parsed.error.message}`);
    }
    console.log(
      `[config] loaded ${parsed.data.sources.length} source(s) from ${configPath}`,
    );
    this.config = parsed.data;
    return this.config;
  }
}

const config = new ConfigService();

export { config };
