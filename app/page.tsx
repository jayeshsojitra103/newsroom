import type { Metadata } from "next";
import { Suspense } from "react";

import { Controls } from "@/components/controls";
import { FeedGrid } from "@/components/feed-grid";
import { Notice, SkeletonGrid } from "@/components/states";
import { TelemetryStrip } from "@/components/telemetry-strip";
import { getProvider, ProviderError } from "@/lib/providers";
import type { NewsProvider } from "@/lib/providers";
import type { ProviderView } from "@/lib/provider-view";
import { parseQuery, queryKey } from "@/lib/url";
import type { FeedQuery } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const provider = getProvider();
  const query = parseQuery(await searchParams, provider);
  const topic = provider.topics.find((item) => item.id === query.topic);

  return {
    title: query.q ? `“${query.q}”` : topic?.title,
    description: topic?.blurb,
  };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const provider = getProvider();
  const query = parseQuery(await searchParams, provider);

  return (
   
    <Suspense
      key={queryKey(query)}
      fallback={<FeedFallback query={query} provider={provider} />}
    >
      <FeedSection query={query} provider={provider} />
    </Suspense>
  );
}

async function FeedSection({ query, provider }: { query: FeedQuery; provider: NewsProvider }) {
  const topic = provider.topics.find((item) => item.id === query.topic);
  const view = serialiseProvider(provider);

  let page;
  try {
    page = await provider.fetchPage(query, null);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "Couldn't load the feed.";
    return (
      <>
        <TelemetryStrip
          provider={provider.label}
          topic={topic?.label ?? query.topic}
          state="error"
        />
        <main id="feed" className="wrap py-6">
          <Notice title="Couldn't load the feed" body={message} variant="error">
            <a href="/" className="btn">
              Try again
            </a>
          </Notice>
        </main>
      </>
    );
  }

  const sources =
    provider.hasSourceFilter && provider.listSources ? await provider.listSources() : [];
  const showLead = !query.q && !query.source && query.sort === provider.defaultSort;

  return (
    <>
      <TelemetryStrip
        provider={provider.label}
        topic={topic?.label ?? query.topic}
        count={page.count}
        loaded={page.items.length}
        sourceCount={sources.length}
        latencyMs={page.latencyMs}
      />

      <div className="wrap">
        <Controls query={query} provider={view} sources={sources} count={page.count} />

        <main id="feed" className="py-6 pb-12">
          <header className="mb-4">
            <h1 className="font-display text-h2 leading-tight font-bold tracking-[-0.015em]">
              {query.q ? `Results for “${query.q}”` : topic?.title}
            </h1>
            <p className="label text-mute">{topic?.blurb}</p>
          </header>

          <FeedGrid
            key={queryKey(query)}
            query={query}
            provider={view}
            initialItems={page.items}
            initialCursor={page.nextCursor}
            initialCount={page.count}
            showLead={showLead}
          />
        </main>
      </div>
    </>
  );
}

function FeedFallback({ query, provider }: { query: FeedQuery; provider: NewsProvider }) {
  const topic = provider.topics.find((item) => item.id === query.topic);

  return (
    <>
      <TelemetryStrip
        provider={provider.label}
        topic={topic?.label ?? query.topic}
        state="loading"
      />
      <div className="wrap">
        <Controls query={query} provider={serialiseProvider(provider)} sources={[]} />
        <main id="feed" className="py-6 pb-12">
          <header className="mb-4">
            <h1 className="font-display text-h2 leading-tight font-bold tracking-[-0.015em]">
              {query.q ? `Results for “${query.q}”` : topic?.title}
            </h1>
            <p className="label text-mute">{topic?.blurb}</p>
          </header>
          <SkeletonGrid />
        </main>
      </div>
    </>
  );
}

function serialiseProvider(provider: NewsProvider): ProviderView {
  return {
    id: provider.id,
    label: provider.label,
    topics: provider.topics.map(({ id, label }) => ({ id, label })),
    sorts: provider.sorts.map(({ value, label }) => ({ value, label })),
    defaultTopic: provider.defaultTopic,
    defaultSort: provider.defaultSort,
    hasSummaries: provider.hasSummaries,
    hasSourceFilter: provider.hasSourceFilter,
  };
}
