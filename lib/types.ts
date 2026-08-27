export interface Story {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
  author: string;
  language: string;
  country: string;
  topic: string;
}

export interface SavedStory extends Story {
  savedAt: string;
  provider: string;
}

export interface NewsPage {
  items: Story[];
  count: number | null;
  nextCursor: string | null;
  latencyMs: number;
}

export interface FeedQuery {
  topic: string;
  q: string;
  source: string;
  sort: string;
}

export interface TopicDef {
  id: string;
  label: string;
  title: string;
  blurb: string;
}

export interface SortDef {
  value: string;
  label: string;
}
