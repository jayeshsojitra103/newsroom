
export const BRAND = {
  lead: "NEWS",
  accent: "ROOM",
  tagline: "live feed",
} as const;

export const APP_NAME = `${BRAND.lead}${BRAND.accent}`;

export const APP_DESCRIPTION =
  "A live feed of world news, aggregated across thousands of publishers. No account, no tracking.";

export const PAGE_SIZE = 12;

export const FEED_REVALIDATE = 60;
export const SOURCES_REVALIDATE = 3600;

export const REQUEST_TIMEOUT_MS = 12_000;

export const SEARCH_DEBOUNCE_MS = 350;

export const AUTO_PAGE_LIMIT = 5;

export const STORAGE_KEY_SAVED = "newsroom:saved:v1";
export const STORAGE_KEY_THEME = "newsroom:theme:v1";

export const FRESH_HOT_HOURS = 2;
export const FRESH_WARM_HOURS = 24;
