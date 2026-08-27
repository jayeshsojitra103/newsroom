import { FEED_REVALIDATE, PAGE_SIZE, SOURCES_REVALIDATE } from "../config";
import type { FeedQuery, NewsPage, Story } from "../types";
import { getJson, ProviderError } from "./http";
import type { NewsProvider } from "./types";


const BASE = "https://newsapi.org/v2";

const CATEGORIES = [
  "general",
  "world",
  "business",
  "technology",
  "science",
  "health",
  "sports",
  "entertainment",
] as const;

interface RawArticle {
  source?: { name?: string };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
}

interface RawResponse {
  status?: string;
  totalResults?: number;
  articles?: RawArticle[];
  code?: string;
  message?: string;
}

function requireKey(): string {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    throw new ProviderError(
      "NEWS_API_KEY is not set. Add it to .env.local or switch NEWS_PROVIDER back to gdelt.",
    );
  }
  return key;
}

function normalise(record: RawArticle, topic: string): Story {
  return {
    id: record.url || crypto.randomUUID(),
    title: record.title?.trim() || "Untitled",
    summary: record.description?.trim() || "",
    url: record.url || "",
    imageUrl: record.urlToImage || "",
    source: record.source?.name || "Unknown source",
    publishedAt: record.publishedAt || "",
    author: record.author?.trim() || "",
    language: "",
    country: "",
    topic,
  };
}

async function fetchPage(query: FeedQuery, cursor?: string | null): Promise<NewsPage> {
  const key = requireKey();
  const page = Math.max(1, Number(cursor ?? "1") || 1);
  const searching = Boolean(query.q.trim());

  const url = new URL(`${BASE}/${searching ? "everything" : "top-headlines"}`);
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("language", "en");
  url.searchParams.set("apiKey", key);

  if (searching) {
    url.searchParams.set("q", query.q.trim());
    url.searchParams.set("sortBy", query.sort);
  } else if (query.topic !== "world") {
    url.searchParams.set("category", query.topic);
  }

  if (query.source) url.searchParams.set("sources", query.source);

  const { data, latencyMs } = await getJson<RawResponse>(url.toString(), {
    revalidate: FEED_REVALIDATE,
    provider: "NewsAPI",
  });

  if (data.status === "error") {
    throw new ProviderError(data.message || "NewsAPI rejected the request.");
  }

  const raw = Array.isArray(data.articles) ? data.articles : [];
  const items = raw
    .filter((record) => record.url && record.title && record.title !== "[Removed]")
    .map((record) => normalise(record, query.topic));

  const count = typeof data.totalResults === "number" ? data.totalResults : null;
  const loaded = page * PAGE_SIZE;
  const hasMore = items.length === PAGE_SIZE && (count === null || loaded < count);

  return {
    items,
    count,
    nextCursor: hasMore ? String(page + 1) : null,
    latencyMs,
  };
}

async function listSources(): Promise<string[]> {
  try {
    const key = requireKey();
    const { data } = await getJson<{ sources?: Array<{ id?: string; name?: string }> }>(
      `${BASE}/top-headlines/sources?language=en&apiKey=${key}`,
      { revalidate: SOURCES_REVALIDATE, provider: "NewsAPI" },
    );
    return (data.sources ?? [])
      .map((source) => source.id)
      .filter((id): id is string => Boolean(id))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export const newsapi: NewsProvider = {
  id: "newsapi",
  label: "NewsAPI.org",
  homepage: "https://newsapi.org/",
  attribution: "NewsAPI.org — 150,000+ sources",
  keyEnvVar: "NEWS_API_KEY",
  hasSummaries: true,
  hasSourceFilter: true,
  caveat:
    "NewsAPI's free plan is development-only and won't serve requests from a deployed origin.",

  topics: CATEGORIES.map((id) => ({
    id,
    label: id === "general" ? "Top" : id === "entertainment" ? "Culture" : id.replace(/^\w/, (c) => c.toUpperCase()),
    title: id === "general" ? "Top stories" : id.replace(/^\w/, (c) => c.toUpperCase()),
    blurb: `Headlines in ${id === "general" ? "the top category" : id}.`,
  })),

  sorts: [
    { value: "publishedAt", label: "Newest first" },
    { value: "relevancy", label: "Most relevant" },
    { value: "popularity", label: "Most popular" },
  ],

  defaultTopic: "general",
  defaultSort: "publishedAt",
  fetchPage,
  listSources,
};
