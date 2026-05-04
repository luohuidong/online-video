import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { AppConfigSchema, AppConfig, Source } from './config.schema';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private config!: AppConfig;

  onModuleInit() {
    const configPath = process.env.CONFIG_PATH
      ? path.resolve(process.env.CONFIG_PATH)
      : path.resolve(process.cwd(), 'config.yml');

    this.logger.log(`Loading config from: ${configPath}`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const raw = yaml.load(fs.readFileSync(configPath, 'utf8'));
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
