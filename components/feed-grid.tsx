"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AUTO_PAGE_LIMIT } from "@/lib/config";
import { formatCount } from "@/lib/format";
import type { ProviderView } from "@/lib/provider-view";
import type { NewsPage, Story } from "@/lib/types";
import { toSearchParams } from "@/lib/url";
import type { FeedQuery } from "@/lib/types";
import { useSaved } from "@/providers/saved-provider";

import { Notice } from "./states";
import { StoryCard } from "./story-card";
import { StoryDrawer } from "./story-drawer";

export function FeedGrid({
  query,
  provider,
  initialItems,
  initialCursor,
  initialCount,
  showLead,
}: {
  query: FeedQuery;
  provider: ProviderView;
  initialItems: Story[];
  initialCursor: string | null;
  initialCount: number | null;
  showLead: boolean;
}) {
  const [items, setItems] = useState<Story[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const autoPages = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const { savedIds, toggle } = useSaved();

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(toSearchParams(query, provider));
      params.set("cursor", cursor);

      const response = await fetch(`/api/news?${params.toString()}`, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Couldn't load more stories.");
      }

      const page = (await response.json()) as NewsPage;

      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(page.nextCursor);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't load more stories.");
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, provider, query]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && cursor && !loading && autoPages.current < AUTO_PAGE_LIMIT) {
          autoPages.current += 1;
          void loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loading, loadMore]);

  const handleToggleSave = useCallback(
    (story: Story) => {
      const added = toggle(story, provider.label);
      showToast(added ? "Saved to your reading list" : "Removed from your reading list");
    },
    [provider.label, showToast, toggle],
  );

  const openStory = items.find((item) => item.id === openId) ?? null;

  if (items.length === 0) {
    return (
      <Notice
        title="Nothing matched that"
        body={
          query.q
            ? `No stories mention “${query.q}” in this topic. Try a shorter term or another topic.`
            : "This topic came back empty. Try another topic or reload."
        }
      >
        <a href="/" className="btn">
          Clear filters
        </a>
      </Notice>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,296px),1fr))] gap-4">
        {items.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            lead={showLead && index === 0}
            saved={savedIds.has(story.id)}
            onOpen={(next) => setOpenId(next.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
      </ul>

      <div ref={sentinel} className="h-px" aria-hidden="true" />

      <div className="flex flex-col items-center gap-3 pt-8">
        {error && <p className="font-mono text-eyebrow text-alert">{error}</p>}

        {cursor ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="btn-ghost hover:border-foil hover:text-foil disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more stories"}
          </button>
        ) : (
          <p className="font-mono text-eyebrow text-mute">
            {initialCount === null
              ? `${formatCount(items.length)} stories loaded`
              : `End of ${formatCount(initialCount)} records`}
          </p>
        )}
      </div>

      {openStory && (
        <StoryDrawer
          story={openStory}
          saved={savedIds.has(openStory.id)}
          providerLabel={provider.label}
          onClose={() => setOpenId(null)}
          onToggleSave={handleToggleSave}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded border border-hair bg-panel-3 px-4 py-2 font-mono text-eyebrow text-chalk shadow-lift"
        >
          {toast}
        </div>
      )}
    </>
  );
}
