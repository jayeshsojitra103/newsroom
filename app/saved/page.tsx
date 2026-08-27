"use client";

import Link from "next/link";
import { useState } from "react";

import { Notice, SkeletonGrid } from "@/components/states";
import { StoryCard } from "@/components/story-card";
import { StoryDrawer } from "@/components/story-drawer";
import { formatCount } from "@/lib/format";
import { useSaved } from "@/providers/saved-provider";

export default function SavedPage() {
  const { saved, savedIds, ready, persistent, toggle, clear } = useSaved();
  const [openId, setOpenId] = useState<string | null>(null);
  const openStory = saved.find((item) => item.id === openId) ?? null;

  return (
    <div className="wrap">
      <main className="py-8 pb-12">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-h2 leading-tight font-bold tracking-[-0.015em]">
              Reading list
            </h1>
            <p className="label text-mute">
              {persistent
                ? "Saved on this device only. Nothing leaves the browser."
                : "This browser blocks local storage, so the list clears when you leave."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="label text-mute">{formatCount(saved.length)} saved</span>
            {saved.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="btn-ghost hover:border-alert hover:text-alert"
              >
                Clear list
              </button>
            )}
          </div>
        </header>

        {!ready ? (
          <SkeletonGrid count={3} />
        ) : saved.length === 0 ? (
          <Notice
            title="Your reading list is empty"
            body="Save a story from the feed and it will wait here for you."
          >
            <Link href="/" className="btn">
              Back to the feed
            </Link>
          </Notice>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,296px),1fr))] gap-4">
            {saved.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                saved={savedIds.has(story.id)}
                onOpen={(next) => setOpenId(next.id)}
                onToggleSave={(next) => toggle(next, story.provider)}
              />
            ))}
          </ul>
        )}

        {openStory && (
          <StoryDrawer
            story={openStory}
            saved={savedIds.has(openStory.id)}
            providerLabel={openStory.provider}
            onClose={() => setOpenId(null)}
            onToggleSave={(story) => {
              toggle(story, openStory.provider);
              setOpenId(null); 
            }}
          />
        )}
      </main>
    </div>
  );
}
