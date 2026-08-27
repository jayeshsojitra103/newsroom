# NEWSROOM

A live world-news reader on the **Next.js App Router** with **Tailwind CSS v4**.
Named after the room where the news-service teletypes used to land. Deep-navy
ground, foil gold, telemetry cyan, and a status strip that reports real numbers.

**Worldwide general news**, not just space. The data source is pluggable: three
providers ship with it, and the default needs **no API key and no sign-up**.

---

## Quick start

```bash
cd newsroom
npm install
npm run dev        # → http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the build
npm run typecheck  # tsc --noEmit
npm test           # unit tests for lib/format.ts (needs Node 22.6+)
```

Requires Node 20.9+ (Node 22+ for `npm test`, which uses Node's built-in type
stripping so the tests need no toolchain).

---

## Providers

Set `NEWS_PROVIDER` in `.env.local`. Topics, sort options and the source filter
all come from whichever provider is active, so switching changes the tab strip
without touching a component.

| `NEWS_PROVIDER` | Coverage | Key | Summaries | Notes |
|---|---|---|---|---|
| `gdelt` **(default)** | Worldwide, 65 languages | none | no | Headlines and metadata only; 3-month window |
| `newsapi` | 150k sources | `NEWS_API_KEY` | yes | Free plan is **development-only** — won't serve a deployed origin |
| `snapi` | Spaceflight only | none | yes | The original source for this app |

```bash
cp .env.example .env.local     # defaults to gdelt, works immediately
```

An unknown `NEWS_PROVIDER`, or a keyed provider with no key set, logs a warning
and falls back to GDELT rather than failing the render — a misconfigured
environment shouldn't take the site down.

### Adding your own

Implement `NewsProvider` (`lib/providers/types.ts`) and register it in
`lib/providers/index.ts`. Nothing else changes:

```ts
export const myProvider: NewsProvider = {
  id: "mine", label: "My Source", homepage: "…", attribution: "…",
  keyEnvVar: "MY_API_KEY",        // omit if keyless
  hasSummaries: true, hasSourceFilter: false,
  topics: [...], sorts: [...],
  defaultTopic: "top", defaultSort: "newest",
  fetchPage(query, cursor) { /* → { items, count, nextCursor, latencyMs } */ },
};
```

**Pagination is cursor-based, not offset-based**, because providers page in
incompatible ways: SNAPI takes an offset, NewsAPI a page number, and GDELT has
no paging at all — its adapter walks backwards in time, returning the oldest
timestamp on the page as the next cursor. The cursor is opaque everywhere except
the adapter that issued it.

**Topic definitions are the adapter's problem.** GDELT has no category endpoint,
so each topic is a curated boolean query; "Top stories" is defined honestly as
the front pages of Reuters, AP, BBC, Al Jazeera and NPR rather than pretending to
a ranking the API doesn't provide.

## What the Next.js version adds

The vanilla build fetched everything in the browser. This one moves the data
layer to the server, which changes four things for the better:

| | Vanilla | Next.js |
|---|---|---|
| First paint | Empty grid, then a client fetch | Server-rendered stories in the initial HTML |
| SEO | Nothing for crawlers | Real content, per-query `<title>` and description |
| Upstream calls | One per visitor | Deduplicated and cached for 60s across all visitors |
| API credentials | Would be public if the provider needed a key | Never reach the browser — see below |

Plus streaming: the masthead and controls paint immediately while the feed
resolves inside a `<Suspense>` boundary that falls back to skeletons.

## Design continuity

Tailwind v4 is configured CSS-first in `app/globals.css`. The palette lives in
`--sw-*` variables on `:root` and `[data-theme="light"]`, and an `@theme inline`
block maps them to utilities:

```css
@theme inline {
  --color-canvas: var(--sw-canvas);
  --color-foil: var(--sw-foil);
  --text-h1: clamp(1.7rem, 1.35rem + 1.6vw, 2.6rem);
}
```

Because the theme block is `inline`, every utility compiles to `var(--sw-*)`, so
flipping `data-theme` on `<html>` recolours the whole app with **no `dark:`
variants anywhere**. Repeated patterns (`label`, `pill`, `btn`, `field`) are
`@utility` definitions rather than copy-pasted class strings.

Fonts load through `next/font/google` and are self-hosted at build time, so
there's no Google Fonts request and no layout shift: Familjen Grotesk for
headlines, Source Serif 4 for reading, IBM Plex Mono for data.

---

## Project structure

```
newsroom/
├── app/
│   ├── layout.tsx          Fonts, metadata, pre-paint theme script, providers
│   ├── page.tsx            Server feed + Suspense boundary + generateMetadata
│   ├── error.tsx           Error boundary
│   ├── saved/page.tsx      Reading list (client — the data is local)
│   ├── api/news/route.ts   Validated pagination proxy
│   └── globals.css         Tailwind v4 theme, tokens, custom utilities
├── components/
│   ├── masthead.tsx        Brand, search, reading-list badge, theme toggle
│   ├── telemetry-strip.tsx Live UTC clock + real server fetch metrics
│   ├── controls.tsx        Collection tabs, filters, active-filter chips
│   ├── feed-grid.tsx       Pagination, infinite scroll, drawer state
│   ├── story-card.tsx      Card with the freshness tick
│   ├── story-drawer.tsx    Detail panel with focus management
│   └── states.tsx          Skeletons, notices, icons
├── lib/
│   ├── providers/
│   │   ├── index.ts        Registry + NEWS_PROVIDER resolution with fallback
│   │   ├── types.ts        The NewsProvider contract
│   │   ├── http.ts         Shared fetch: timeout, caching, latency, errors
│   │   ├── gdelt.ts        Worldwide news, keyless, time-cursor paging
│   │   ├── newsapi.ts      Categories + summaries, key from env
│   │   └── snapi.ts        Spaceflight only, offset paging
│   ├── config.ts           Page size, revalidate windows, storage keys
│   ├── format.ts           Pure helpers (T+ ages, reading time, safeUrl)
│   ├── url.ts              Provider-aware query validation
│   ├── provider-view.ts    Serialisable projection for client components
│   └── types.ts            Provider-agnostic Story and NewsPage shapes
├── providers/saved-provider.tsx
└── tests/format.test.ts
```

**URL as state.** Collection, query, source and sort all live in the query
string, parsed by one validator (`lib/url.ts`) used by both the page and the
route handler. Tabs are real `<Link>`s — middle-clickable, shareable, indexable.
The `<Suspense>` boundary and `FeedGrid` are keyed on the query, so a navigation
resets feed state instead of syncing props into `useState`.

---

## Security notes

- **Keys never reach the browser.** `lib/providers/index.ts` is `server-only`,
  and client pagination goes through `/api/news`, which re-validates every
  parameter against the active provider's own topics and sorts and caps the
  cursor length. `NEWS_API_KEY` is read in the adapter, on the server. This is
  why a keyed provider is safe here and wasn't in the vanilla build.
- **Story images use a plain `<img>`, not `next/image`.** They come from dozens
  of publisher domains that can't be allowlisted in advance, and pointing the
  image optimiser at arbitrary hosts is a known abuse vector. `next.config.ts`
  also sets `nosniff`, `no-referrer` and `DENY` framing.
- **The reading list never leaves the browser.** `localStorage`, with an
  in-memory fallback when a browser blocks it, and no analytics anywhere.

## Limitations, honestly

- **I couldn't run `npm install` or `next build` in the environment where this
  was written** — no network access. Types were verified with `tsc` against stub
  declarations and `lib/format.ts` is unit tested, but the first real `npm run
  dev` is your smoke test. If Tailwind classes look unstyled, confirm
  `@tailwindcss/postcss` installed cleanly.
- ESLint isn't configured. `next lint` was removed in Next 16, so add
  `eslint` + `eslint-config-next` yourself if you want it.
- Full article text isn't available from the API by design — cards link out to
  the publisher. Headlines and summaries belong to their publishers.
- The `Fetch` figure on the telemetry strip is the *server's* upstream latency
  for the first page. It reads `0 ms`-ish on cache hits, which is accurate.
- GDELT reports no result total, so the strip shows `Loaded` instead of
  `Indexed`, and cards fall back to country/language where a summary would be.
- **The GDELT adapter is the least battle-tested part.** Its topic queries are
  editorial choices you may want to retune in `lib/providers/gdelt.ts`, and its
  time-walking pagination can return a short page near a quiet interval.

## Deploying

Any Node host or Vercel. There are no environment variables and no database, so
`git push` is the whole pipeline.

## License

MIT for the application code. SNAPI is BSD 2-Clause; news content belongs to the
respective publishers.
