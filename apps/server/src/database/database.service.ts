import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import config from '../../drizzle.config';

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
