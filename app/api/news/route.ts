import { NextResponse } from "next/server";

import { getProvider, ProviderError } from "@/lib/providers";
import { parseQuery } from "@/lib/url";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = getProvider();

  const query = parseQuery(
    {
      topic: searchParams.get("topic") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    },
    provider,
  );

  const cursor = (searchParams.get("cursor") ?? "").slice(0, 64) || null;

  try {
    const page = await provider.fetchPage(query, cursor);
    return NextResponse.json(page, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  } catch (error) {
    const status = error instanceof ProviderError && error.status >= 400 ? 502 : 503;
    const message =
      error instanceof ProviderError ? error.message : "Couldn't load more stories.";
    return NextResponse.json({ error: message }, { status });
  }
}
