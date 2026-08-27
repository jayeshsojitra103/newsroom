

import test from "node:test";
import assert from "node:assert/strict";

import {
  absoluteUtc,
  authorNames,
  formatCount,
  freshness,
  readingTime,
  relativeAge,
  safeUrl,
  truncate,
  utcClock,
} from "../lib/format.ts";

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

test("safeUrl allows http(s) and rejects everything else", () => {
  assert.equal(safeUrl("https://nasa.gov/a"), "https://nasa.gov/a");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,<script>"), "");
  assert.equal(safeUrl(""), "");
  assert.equal(safeUrl(undefined), "");
});

test("relativeAge uses mission-clock notation", () => {
  assert.equal(relativeAge(minutesAgo(0)), "T+ now");
  assert.equal(relativeAge(minutesAgo(42)), "T+ 42m");
  assert.equal(relativeAge(minutesAgo(60 * 5)), "T+ 5h");
  assert.equal(relativeAge(minutesAgo(60 * 24 * 3)), "T+ 3d");
  assert.equal(relativeAge("not-a-date"), "unknown");
});

test("relativeAge falls back to a calendar date beyond a fortnight", () => {
  const old = relativeAge(minutesAgo(60 * 24 * 40));
  assert.ok(!old.startsWith("T+"), `expected a date, got ${old}`);
});

test("freshness buckets by age", () => {
  assert.equal(freshness(minutesAgo(30)), "hot");
  assert.equal(freshness(minutesAgo(60 * 8)), "warm");
  assert.equal(freshness(minutesAgo(60 * 48)), "cold");
});

test("absoluteUtc renders a UTC stamp", () => {
  assert.equal(absoluteUtc("2026-04-15T14:30:00Z"), "2026-04-15 14:30 UTC");
});

test("utcClock is a 24h time string", () => {
  assert.equal(utcClock(new Date("2026-04-15T14:30:09Z")), "14:30:09");
});

test("readingTime rounds to whole minutes and handles empties", () => {
  assert.equal(readingTime(""), "");
  assert.equal(readingTime("word ".repeat(230).trim()), "1 min read");
  assert.equal(readingTime("word ".repeat(690).trim()), "3 min read");
});

test("truncate breaks on a word boundary", () => {
  const result = truncate("the quick brown fox jumps over the lazy dog", 20);
  assert.ok(result.endsWith("…"));
  assert.ok(result.length <= 22, result);
  assert.equal(truncate("short", 20), "short");
});

test("formatCount groups thousands", () => {
  assert.equal(formatCount(85214), "85,214");
  assert.equal(formatCount(undefined), "—");
});

test("authorNames joins present names only", () => {
  assert.equal(authorNames([{ name: "A" }, {}, { name: "B" }]), "A, B");
  assert.equal(authorNames([]), "");
  assert.equal(authorNames(undefined), "");
});
