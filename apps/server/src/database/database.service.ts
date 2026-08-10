import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import {
  type BetterSQLite3Database,
  drizzle,
} from 'drizzle-orm/better-sqlite3';
import config from '../../drizzle.config';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit {
  private readonly logger = new Logger(DrizzleService.name);
  db!: BetterSQLite3Database<typeof schema>;

  async onModuleInit() {
    const dbPath = config.dbCredentials.url as string;
    this.logger.log(`Initializing SQLite database at: ${dbPath}`);

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    this.db = drizzle(sqlite, { schema });

    this.logger.log('Database initialized');
  }
}
