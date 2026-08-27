

const FRESH_HOT_HOURS = 2;
const FRESH_WARM_HOURS = 24;

export type Freshness = "hot" | "warm" | "cold";

export function safeUrl(value: string | undefined | null): string {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

const numberFormat = new Intl.NumberFormat("en-US");

export function formatCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormat.format(value)
    : "—";
}

export function relativeAge(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "unknown";

  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "T+ now";
  if (minutes < 60) return `T+ ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `T+ ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days <= 14) return `T+ ${days}d`;

  return absoluteDate(iso);
}

export function freshness(iso: string): Freshness {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "cold";

  const hours = (Date.now() - then) / 3_600_000;
  if (hours <= FRESH_HOT_HOURS) return "hot";
  if (hours <= FRESH_WARM_HOURS) return "warm";
  return "cold";
}

export function absoluteDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function absoluteUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function utcClock(date: Date = new Date()): string {
  return date.toISOString().slice(11, 19);
}

export function readingTime(text: string): string {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "";
  return `${Math.max(1, Math.round(words / 230))} min read`;
}

export function truncate(text: string, max = 220): string {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.lastIndexOf(" ", max);
  return `${value.slice(0, cut > 0 ? cut : max).trimEnd()}…`;
}

export function authorNames(authors: Array<{ name?: string }> | undefined): string {
  if (!Array.isArray(authors) || authors.length === 0) return "";
  return authors
    .map((author) => author?.name)
    .filter(Boolean)
    .join(", ");
}
