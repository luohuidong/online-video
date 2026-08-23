import fs from 'node:fs';
import path from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { load } from 'js-yaml';
import { type AppConfig, AppConfigSchema, type Source } from './config.schema';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private config!: AppConfig;

  onModuleInit() {
    const configPath = path.resolve(process.cwd(), 'config.yml');

    this.logger.log(`Loading config from: ${configPath}`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const raw = load(fs.readFileSync(configPath, 'utf8'));
    const result = AppConfigSchema.safeParse(raw);

    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    this.config = result.data;
    this.logger.log(`Config loaded: ${result.data.sources.length} source(s)`);
  }

  getSources(): Source[] {
    return this.config.sources;
  }
}
