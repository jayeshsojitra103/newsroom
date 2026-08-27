"use client";

import { absoluteUtc, freshness, readingTime, relativeAge, safeUrl, truncate } from "@/lib/format";
import type { Story } from "@/lib/types";

import { BookmarkIcon } from "./states";

const TICK_COLOUR: Record<string, string> = {
  hot: "bg-foil",
  warm: "bg-signal",
  cold: "bg-mute",
};

function CardMedia({ story, lead }: { story: Story; lead: boolean }) {
  const src = safeUrl(story.imageUrl);

  if (!src) {
    return (
      <div
        className={`grid place-items-center bg-panel-3 label text-mute ${
          lead ? "min-h-[320px] md:basis-[52%]" : "aspect-video"
        }`}
      >
        No image
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-panel-3 ${
        lead ? "aspect-video md:aspect-auto md:min-h-[320px] md:shrink-0 md:basis-[52%]" : "aspect-video"
      }`}
    >
     
      <img
        src={src}
        alt=""
        loading={lead ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover transition-transform duration-500 ease-sw group-hover:scale-[1.03]"
      />
    </div>
  );
}

export function StoryCard({
  story,
  lead = false,
  saved,
  onOpen,
  onToggleSave,
}: {
  story: Story;
  lead?: boolean;
  saved: boolean;
  onOpen: (story: Story) => void;
  onToggleSave: (story: Story) => void;
}) {
  const href = safeUrl(story.url);
  const summary = truncate(story.summary, lead ? 340 : 190);
  const read = readingTime(story.summary);

  return (
    <li
      className={`group relative flex flex-col overflow-hidden rounded-card border border-hair-soft bg-panel transition duration-200 ease-sw hover:-translate-y-0.5 hover:border-hair hover:shadow-lift motion-reduce:hover:translate-y-0 ${
        lead ? "col-span-full md:flex-row" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 z-[2] w-[3px] ${
          TICK_COLOUR[freshness(story.publishedAt)]
        }`}
      />

      <CardMedia story={story} lead={lead} />

      <div className={`flex flex-1 flex-col gap-2 ${lead ? "justify-center p-4 md:p-8" : "p-4"}`}>
        {lead && (
          <span className="label self-start bg-foil px-2 py-0.5 text-foil-ink">Lead story</span>
        )}

        <div className="label flex items-center gap-2 text-mute">
          <span className="truncate text-signal">{story.source}</span>
          <time
            dateTime={story.publishedAt || undefined}
            title={absoluteUtc(story.publishedAt)}
            className="ml-auto shrink-0 tabular-nums"
          >
            {relativeAge(story.publishedAt)}
          </time>
        </div>

        <h3
          className={`font-display font-bold tracking-[-0.01em] ${
            lead ? "text-h3 md:text-h1 md:leading-[1.08]" : "text-h3 leading-[1.22]"
          }`}
        >
          <button
            type="button"
            onClick={() => onOpen(story)}
            className="block w-full cursor-pointer text-left transition-colors hover:text-foil"
          >
            {story.title}
          </button>
        </h3>

        {summary ? (
          <p
            className={`text-dim ${
              lead ? "line-clamp-3 md:line-clamp-5 md:text-h3" : "line-clamp-3"
            }`}
          >
            {summary}
          </p>
        ) : (
          
          <p className="label text-mute">
            {[story.country, story.language && story.language.toUpperCase()]
              .filter(Boolean)
              .join(" · ") || "Headline only"}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-hair-soft pt-3">
          <span className="mr-auto font-mono text-eyebrow text-mute">{read}</span>

          <button
            type="button"
            onClick={() => onToggleSave(story)}
            aria-pressed={saved}
            title={saved ? "Remove from reading list" : "Save to reading list"}
            className={`pill hover:border-foil hover:text-foil ${
              saved ? "border-foil text-foil" : ""
            }`}
          >
            <BookmarkIcon filled={saved} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>

          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="pill hover:border-foil hover:text-foil"
            >
              Read
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
