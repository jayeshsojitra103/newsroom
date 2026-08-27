"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatCount } from "@/lib/format";
import type { ProviderView } from "@/lib/provider-view";
import type { FeedQuery } from "@/lib/types";
import { feedHref } from "@/lib/url";


export function Controls({
  query,
  provider,
  sources,
  count,
}: {
  query: FeedQuery;
  provider: ProviderView;
  sources: string[];
  count?: number | null;
}) {
  const router = useRouter();

  const href = (next: FeedQuery) => feedHref(next, provider);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-hair-soft pt-6 pb-4">
        <div
          role="tablist"
          aria-label="Topic"
          className="flex w-full flex-wrap overflow-hidden rounded border border-hair sm:w-auto"
        >
          {provider.topics.map((topic) => {
            const active = topic.id === query.topic;
            return (
              <Link
                key={topic.id}
                href={href({ ...query, topic: topic.id })}
                role="tab"
                aria-selected={active}
                scroll={false}
                className={`label flex-1 border-r border-hair px-3.5 py-2 text-center tracking-[0.08em] no-underline transition-colors last:border-r-0 sm:flex-none ${
                  active ? "bg-foil text-foil-ink" : "text-mute hover:bg-panel-2 hover:text-chalk"
                }`}
              >
                {topic.label}
              </Link>
            );
          })}
        </div>

        {provider.hasSourceFilter && (
          <>
            <label htmlFor="source" className="sr-only">
              Filter by source
            </label>
            {/* <select
              id="source"
              value={query.source}
              disabled={sources.length === 0}
              onChange={(event) => router.push(href({ ...query, source: event.target.value }), { scroll: false })}
              className="select-sw disabled:opacity-60"
            >
              <option value="">
                {sources.length ? `All sources (${sources.length})` : "All sources"}
              </option>
              {sources.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select> */}
          </>
        )}

        <label htmlFor="sort" className="sr-only">
          Sort order
        </label>
        <select
          id="sort"
          value={query.sort}
          onChange={(event) => router.push(href({ ...query, sort: event.target.value }), { scroll: false })}
          className="select-sw"
        >
          {provider.sorts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="label ml-auto text-mute" aria-live="polite">
          {resultLabel(query.q, count)}
        </span>
      </div>

      {(query.q || query.source) && (
        <div className="flex flex-wrap gap-2 pt-3">
          {query.q && <Chip label={`Search: ${query.q}`} href={href({ ...query, q: "" })} />}
          {query.source && (
            <Chip label={`Source: ${query.source}`} href={href({ ...query, source: "" })} />
          )}
        </div>
      )}
    </>
  );
}

function resultLabel(q: string, count?: number | null): string {
  if (count === null || count === undefined) {
    return q ? `Matches for “${q}”` : "Live feed";
  }
  return q ? `${formatCount(count)} matches for “${q}”` : `${formatCount(count)} records indexed`;
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-panel-2 px-2.5 py-1 font-mono text-eyebrow text-dim">
      {label}
      <Link
        href={href}
        scroll={false}
        aria-label={`Clear ${label}`}
        className="leading-none text-mute no-underline transition-colors hover:text-alert"
      >
        ×
      </Link>
    </span>
  );
}
