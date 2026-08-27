import { FEED_REVALIDATE, PAGE_SIZE, SOURCES_REVALIDATE } from "../config";
import type { FeedQuery, NewsPage, Story } from "../types";
import { getJson } from "./http";
import type { NewsProvider } from "./types";

const BASE = "https://api.spaceflightnewsapi.net/v4";

interface RawStory {
  id?: number;
  title?: string;
  summary?: string;
  url?: string;
  image_url?: string;
  news_site?: string;
  published_at?: string;
  authors?: Array<{ name?: string }>;
}

function normalise(record: RawStory, topic: string): Story {
  return {
    id: String(record.id ?? record.url ?? crypto.randomUUID()),
    title: record.title || "Untitled",
    summary: record.summary || "",
    url: record.url || "",
    imageUrl: record.image_url || "",
    source: record.news_site || "Unknown source",
    publishedAt: record.published_at || "",
    author: (record.authors ?? []).map((a) => a?.name).filter(Boolean).join(", "),
    language: "",
    country: "",
    topic,
  };
}

async function fetchPage(query: FeedQuery, cursor?: string | null): Promise<NewsPage> {
  const offset = Math.max(0, Number(cursor ?? "0") || 0);

  const url = new URL(`${BASE}/${query.topic}/`);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("ordering", query.sort);
  if (query.q) url.searchParams.set("search", query.q);
  if (query.source) url.searchParams.set("news_site", query.source);

  const { data, latencyMs } = await getJson<{
    count?: number;
    next?: string | null;
    results?: RawStory[];
  }>(url.toString(), { revalidate: FEED_REVALIDATE, provider: "SNAPI" });

  const results = Array.isArray(data.results) ? data.results : [];

  return {
    items: results.map((record) => normalise(record, query.topic)),
    count: typeof data.count === "number" ? data.count : null,
    nextCursor: data.next ? String(offset + PAGE_SIZE) : null,
    latencyMs,
  };
}

async function listSources(): Promise<string[]> {
  try {
    const { data } = await getJson<{ news_sites?: string[] }>(`${BASE}/info/`, {
      revalidate: SOURCES_REVALIDATE,
      provider: "SNAPI",
    });
    return [...(data.news_sites ?? [])].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export const snapi: NewsProvider = {
  id: "snapi",
  label: "Spaceflight News API",
  homepage: "https://spaceflightnewsapi.net/",
  attribution: "Spaceflight News API v4 — free, no key required",
  hasSummaries: true,
  hasSourceFilter: true,
  caveat: "SNAPI covers spaceflight only.",

  topics: [
    { id: "articles", label: "Articles", title: "Latest news", blurb: "News reports from 40+ spaceflight outlets." },
    { id: "blogs", label: "Blogs", title: "Long reads", blurb: "Deeper analysis and independent coverage." },
    { id: "reports", label: "Reports", title: "Mission reports", blurb: "Agency and station status publications." },
  ],

  sorts: [
    { value: "-published_at", label: "Newest first" },
    { value: "published_at", label: "Oldest first" },
    { value: "-updated_at", label: "Recently updated" },
  ],

  defaultTopic: "articles",
  defaultSort: "-published_at",
  fetchPage,
  listSources,
};
