import type { FeedQuery } from "./types";

type RawParams = Record<string, string | string[] | undefined>;

export interface QueryRules {
  topics: ReadonlyArray<{ id: string }>;
  sorts: ReadonlyArray<{ value: string }>;
  defaultTopic: string;
  defaultSort: string;
  hasSourceFilter: boolean;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseQuery(params: RawParams, rules: QueryRules): FeedQuery {
  const topic = first(params.topic);
  const sort = first(params.sort);

  return {
    topic: rules.topics.some((item) => item.id === topic) ? topic : rules.defaultTopic,
    q: first(params.q).slice(0, 120).trim(),
    source: rules.hasSourceFilter ? first(params.source).slice(0, 80).trim() : "",
    sort: rules.sorts.some((item) => item.value === sort) ? sort : rules.defaultSort,
  };
}

export function toSearchParams(query: FeedQuery, rules: QueryRules): string {
  const params = new URLSearchParams();
  if (query.topic !== rules.defaultTopic) params.set("topic", query.topic);
  if (query.q) params.set("q", query.q);
  if (query.source) params.set("source", query.source);
  if (query.sort !== rules.defaultSort) params.set("sort", query.sort);
  return params.toString();
}

export function feedHref(query: FeedQuery, rules: QueryRules): string {
  const search = toSearchParams(query, rules);
  return search ? `/?${search}` : "/";
}

export function queryKey(query: FeedQuery): string {
  return `${query.topic}|${query.q}|${query.source}|${query.sort}`;
}
