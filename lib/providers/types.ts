import type { FeedQuery, NewsPage, SortDef, TopicDef } from "../types";

export interface NewsProvider {
  id: string;
  label: string;
  homepage: string;
  attribution: string;

  keyEnvVar?: string;
  hasSummaries: boolean;
  hasSourceFilter: boolean;
  caveat?: string;

  topics: TopicDef[];
  sorts: SortDef[];
  defaultTopic: string;
  defaultSort: string;

  fetchPage(query: FeedQuery, cursor?: string | null): Promise<NewsPage>;

  listSources?(): Promise<string[]>;
}
