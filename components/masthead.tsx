"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { BRAND, SEARCH_DEBOUNCE_MS, STORAGE_KEY_THEME } from "@/lib/config";
import { useSaved } from "@/providers/saved-provider";

import { BookmarkIcon } from "./states";

const ICON_BUTTON =
  "relative grid size-9 cursor-pointer place-items-center rounded border border-hair bg-panel-2 text-dim transition-colors hover:border-foil hover:text-foil";

const SEARCH_WRAPPER =
  "relative order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:basis-60 sm:max-w-[380px]";

export function Masthead() {
  const pathname = usePathname();
  const { saved, ready } = useSaved();
  const onSaved = pathname === "/saved";

  return (
    <header className="sticky top-0 z-30 border-b border-hair-soft bg-canvas/90 backdrop-blur-md">
      <div className="wrap flex flex-wrap items-center gap-4 py-3">
        <Link href="/" className="mr-auto flex items-baseline gap-2 no-underline">
          <span className="font-display text-h2 leading-none font-bold tracking-[-0.02em]">
            {BRAND.lead}
            <span className="text-foil">{BRAND.accent}</span>
          </span>
          <span className="label text-mute">{BRAND.tagline}</span>
        </Link>

       
        <Suspense fallback={<SearchFieldFallback />}>
          <SearchField />
        </Suspense>

        <Link
          href={onSaved ? "/" : "/saved"}
          aria-current={onSaved ? "page" : undefined}
          title="Reading list"
          className={`${ICON_BUTTON} ${
            onSaved ? "border-foil bg-foil text-foil-ink hover:text-foil-ink" : ""
          }`}
        >
          <BookmarkIcon filled={onSaved} />
          <span className="sr-only">Reading list</span>
          {ready && saved.length > 0 && (
            <span className="absolute -top-2 -right-2 min-w-4 rounded-full bg-signal px-1 font-mono text-[0.63rem] leading-4 text-[#051216]">
              {saved.length}
            </span>
          )}
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}

function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");

      const search = params.toString();
      router.replace(search ? `/?${search}` : "/", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  
  }, [value, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={SEARCH_WRAPPER}>
      <label htmlFor="search" className="sr-only">
        Search stories
      </label>
      <input
        ref={inputRef}
        id="search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setValue("");
        }}
        placeholder="Search headlines and summaries"
        autoComplete="off"
        spellCheck={false}
        className="field placeholder:text-mute"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-sm border border-hair px-1.5 font-mono text-[0.68rem] text-mute sm:block">
        /
      </kbd>
    </div>
  );
}

function SearchFieldFallback() {
  return (
    <div className={SEARCH_WRAPPER}>
      <input
        type="search"
        disabled
        placeholder="Search headlines and summaries"
        aria-hidden="true"
        className="field placeholder:text-mute"
      />
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function switchTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, next);
    } catch {
    }
  }

  return (
    <button
      type="button"
      onClick={switchTheme}
      title="Switch between dark and light"
      aria-pressed={theme === "light"}
      className={ICON_BUTTON}
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
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
      </svg>
      <span className="sr-only">Switch theme</span>
    </button>
  );
}
