import { type AppConfig, AppConfigSchema, type Source } from './schema';

class ConfigService {
  private config: AppConfig | null = null;

  async getSources(): Promise<Source[]> {
    const config = await this.load();
    return config.sources;
  }

  private async load(): Promise<AppConfig> {
    if (this.config) return this.config;

    const configPath = `${process.cwd()}/config.yml`;
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const raw = Bun.YAML.parse(await file.text());
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
