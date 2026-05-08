export interface SearchResult {
  sourceVideoId: string;
  title: string;
  poster: string;
  videoPlayGroups: [string, string][][];
  sourceId: string;
  sourceName: string;
  year: string;
  desc?: string;
}

export interface Favorite {
  id: number;
  updatedAt: number;
  video: {
    id: number;
    title: string;
    sourceId: string;
    sourceVideoId: string;
    sourceName: string;
    cover: string | null;
    year: string | null;
    totalEpisodes: number | null;
  };
}

export interface PlayRecord {
  id: number;
  episodeIndex: number | null;
  updatedAt: number;
  video: {
    id: number;
    title: string;
    sourceId: string;
    sourceVideoId: string;
    sourceName: string;
    cover: string | null;
    year: string | null;
    totalEpisodes: number | null;
  };
}

export interface SearchHistoryItem {
  keyword: string;
  createdAt: number;
}