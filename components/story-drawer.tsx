"use client";

import { useEffect, useRef, useState } from "react";

import { absoluteUtc, relativeAge, safeUrl } from "@/lib/format";
import type { Story } from "@/lib/types";

function rows(story: Story, providerLabel: string): Array<[string, string]> {
  const entries: Array<[string, string] | null> = [
    ["Source", story.source],
    ["Published", absoluteUtc(story.publishedAt)],
    story.author ? ["Byline", story.author] : null,
    ["Topic", story.topic],
    story.country ? ["Country", story.country] : null,
    story.language ? ["Language", story.language.toUpperCase()] : null,
    ["Via", providerLabel],
  ];

  return entries.filter((entry): entry is [string, string] => entry !== null);
}

export function StoryDrawer({
  story,
  saved,
  providerLabel,
  onClose,
  onToggleSave,
}: {
  story: Story;
  saved: boolean;
  providerLabel: string;
  onClose: () => void;
  onToggleSave: (story: Story) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const href = safeUrl(story.url);
  const image = safeUrl(story.imageUrl);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  async function copyLink() {
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgb(4_7_13/0.6)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-[560px] animate-slide-in flex-col border-l border-hair bg-panel shadow-lift"
      >
        <div className="flex items-center gap-3 border-b border-hair-soft p-3 px-4">
          <span className="label mr-auto text-mute">
            {relativeAge(story.publishedAt)} · {story.source}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close story details"
            className="grid size-9 cursor-pointer place-items-center rounded border border-hair bg-panel-2 text-dim transition-colors hover:border-foil hover:text-foil"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 pt-6 pb-8">
          {image && (
            <div className="mb-4 aspect-video overflow-hidden rounded bg-panel-3">
             
              <img
                src={image}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <h2
            id="drawer-title"
            className="mb-3 font-display text-h1 leading-[1.1] font-bold tracking-[-0.015em]"
          >
            {story.title}
          </h2>

          <p className="mb-6 text-h3 leading-relaxed text-dim">
            {story.summary || "This provider indexes headlines only. Open the original to read the story."}
          </p>

          <dl className="mb-6 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 border-t border-hair-soft pt-4 font-mono text-eyebrow">
            {rows(story, providerLabel).map(([term, value]) => (
              <div key={term} className="col-span-2 grid grid-cols-subgrid">
                <dt className="label text-mute">{term}</dt>
                <dd className="break-words text-dim">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" className="btn">
                Read at source
              </a>
            )}
            <button type="button" onClick={() => onToggleSave(story)} className="btn-ghost">
              {saved ? "Remove from list" : "Save for later"}
            </button>
            {href && (
              <button type="button" onClick={copyLink} className="btn-ghost">
                {copied ? "Link copied" : "Copy link"}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
