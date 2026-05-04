import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { searchSource, getDetailFromSource } from './core/scraper';
import { SearchResult } from './core/types';

@Injectable()
export class VideosService {
  constructor(private readonly configService: AppConfigService) {}

  async search(query: string): Promise<SearchResult[]> {
    const sources = this.configService.getSources();
    const maxPages = 5;
    const results = await Promise.all(sources.map((src) => searchSource(src, query, maxPages)));
    return results.flat();
  }

  async getDetail(sourceId: string, sourceVideoId: string): Promise<SearchResult> {
    const sources = this.configService.getSources();
    const source = sources.find((s) => s.sourceId === sourceId);
    if (!source) throw new Error(`Source not found: ${sourceId}`);
    return getDetailFromSource(source, sourceVideoId);
  }
}
