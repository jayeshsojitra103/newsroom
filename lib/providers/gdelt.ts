import { FEED_REVALIDATE, PAGE_SIZE } from "../config";
import type { FeedQuery, NewsPage, Story } from "../types";
import { getJson, ProviderError } from "./http";
import type { NewsProvider } from "./types";


const BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

const TOPIC_QUERIES: Record<string, string> = {
  top: "(domain:reuters.com OR domain:apnews.com OR domain:bbc.co.uk OR domain:aljazeera.com OR domain:npr.org)",
  world: "(geopolitics OR diplomacy OR election OR parliament OR ceasefire)",
  business: "(economy OR markets OR inflation OR earnings OR \"central bank\")",
  technology: "(technology OR \"artificial intelligence\" OR software OR semiconductor OR cybersecurity)",
  science: "(science OR research OR climate OR \"peer reviewed\" OR discovery)",
  health: "(health OR medicine OR hospital OR vaccine OR outbreak)",
  sport: "(football OR cricket OR olympics OR tennis OR championship)",
  space: "(spacex OR nasa OR rocket OR satellite OR \"space station\")",
};

interface RawArticle {
  url?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

function parseSeenDate(value: string | undefined): string {
  if (!value || value.length < 15) return "";
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(
    9,
    11,
  )}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
  return Number.isNaN(Date.parse(iso)) ? "" : iso;
}

function toGdeltStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
}

function prettyDomain(domain: string | undefined): string {
  if (!domain) return "Unknown source";
  return domain.replace(/^www\./, "");
}

function normalise(record: RawArticle, topic: string): Story {
  return {
    id: record.url || crypto.randomUUID(),
    title: record.title?.trim() || "Untitled",
    summary: "",
    url: record.url || "",
    imageUrl: record.socialimage || "",
    source: prettyDomain(record.domain),
    publishedAt: parseSeenDate(record.seendate),
    author: "",
    language: record.language || "",
    country: record.sourcecountry || "",
    topic,
  };
}

async function fetchPage(query: FeedQuery, cursor?: string | null): Promise<NewsPage> {
  const topicQuery = TOPIC_QUERIES[query.topic] ?? TOPIC_QUERIES.top;

  const parts = [query.q.trim() ? `"${query.q.trim().replace(/"/g, "")}"` : topicQuery];
  if (query.source) parts.push(`domain:${query.source}`);

  const url = new URL(BASE);
  url.searchParams.set("query", parts.join(" "));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(PAGE_SIZE * 2));
  url.searchParams.set("sort", query.sort);

  if (cursor) {
    const end = new Date(cursor);
    if (Number.isNaN(end.getTime())) throw new ProviderError("Invalid pagination cursor.");
  
    const start = new Date(end.getTime() - 7 * 24 * 3_600_000);
    url.searchParams.set("startdatetime", toGdeltStamp(start));
    url.searchParams.set("enddatetime", toGdeltStamp(end));
  } else {
    url.searchParams.set("timespan", "3d");
  }

  const { data, latencyMs } = await getJson<{ articles?: RawArticle[] }>(url.toString(), {
    revalidate: FEED_REVALIDATE,
    provider: "GDELT",
  });

  const raw = Array.isArray(data.articles) ? data.articles : [];

  const seen = new Set<string>();
  const items = raw
    .map((record) => normalise(record, query.topic))
    .filter((story) => {
      if (!story.url || seen.has(story.url)) return false;
      seen.add(story.url);
      return true;
    });

  const dated = items.filter((story) => story.publishedAt);
  const oldest = dated.length
    ? dated.reduce((min, story) => (story.publishedAt < min ? story.publishedAt : min), dated[0].publishedAt)
    : null;

  const canPage = query.sort.startsWith("Date") && oldest !== null && items.length > 0;
  const nextCursor = canPage
    ? new Date(Date.parse(oldest as string) - 1000).toISOString()
    : null;

  return {
    items,
    count: null,
    nextCursor,
    latencyMs,
  };
}

export const gdelt: NewsProvider = {
  id: "gdelt",
  label: "GDELT DOC 2.0",
  homepage: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
  attribution: "The GDELT Project — worldwide news, no key required",
  hasSummaries: false,
  hasSourceFilter: false,
  caveat: "GDELT indexes headlines and metadata, not article summaries.",

  topics: [
    { id: "top", label: "Top", title: "Top stories", blurb: "Front pages of Reuters, AP, BBC, Al Jazeera and NPR." },
    { id: "world", label: "World", title: "World", blurb: "Politics, diplomacy and conflict worldwide." },
    { id: "business", label: "Business", title: "Business", blurb: "Markets, economies and corporate news." },
    { id: "technology", label: "Tech", title: "Technology", blurb: "Computing, AI, chips and security." },
    { id: "science", label: "Science", title: "Science", blurb: "Research, climate and discovery." },
    { id: "health", label: "Health", title: "Health", blurb: "Medicine, public health and outbreaks." },
    { id: "sport", label: "Sport", title: "Sport", blurb: "Results and reporting across major sports." },
    { id: "space", label: "Space", title: "Spaceflight", blurb: "Launches, missions and satellites." },
  ],

  sorts: [
    { value: "DateDesc", label: "Newest first" },
    { value: "DateAsc", label: "Oldest first" },
    { value: "HybridRel", label: "Most relevant" },
  ],

  defaultTopic: "top",
  defaultSort: "DateDesc",
  fetchPage,
};
