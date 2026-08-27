"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { formatCount, utcClock } from "@/lib/format";

export function TelemetryStrip({
  provider,
  topic,
  count,
  loaded,
  sourceCount,
  latencyMs,
  state = "ready",
}: {
  provider: string;
  topic: string;
  count?: number | null;
  loaded?: number;
  sourceCount?: number;
  latencyMs?: number;
  state?: "loading" | "ready" | "error";
}) {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    setClock(utcClock());
    const timer = setInterval(() => setClock(utcClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  const linkText = { loading: "fetching", ready: "nominal", error: "fault" }[state];
  const dotColour = {
    loading: "bg-foil",
    ready: "bg-signal animate-pulse",
    error: "bg-alert",
  }[state];

  return (
    <div className="border-b border-hair-soft bg-panel">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-2 font-mono text-eyebrow tracking-[0.04em] text-mute">
        <Cell label="Link">
          <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${dotColour}`} />
          {linkText}
        </Cell>

        <Cell label="Feed">{provider}</Cell>
        <Cell label="Topic">{topic}</Cell>

        {typeof count === "number" ? (
          <Cell label="Indexed">{formatCount(count)}</Cell>
        ) : typeof loaded === "number" ? (
          <Cell label="Loaded">{formatCount(loaded)}</Cell>
        ) : null}

        {sourceCount ? <Cell label="Sources">{formatCount(sourceCount)}</Cell> : null}
        {typeof latencyMs === "number" ? (
          <Cell label="Fetch">{`${formatCount(latencyMs)} ms`}</Cell>
        ) : null}

        <Cell label="UTC" accent>
          {clock ?? "--:--:--"}
        </Cell>
      </div>
    </div>
  );
}

function Cell({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {label}
      <b className={`font-medium tabular-nums ${accent ? "text-signal" : "text-dim"}`}>{children}</b>
    </span>
  );
}
