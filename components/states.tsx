import type { ReactNode } from "react";

export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-5-6 5z" />
    </svg>
  );
}

export function CardSkeleton() {
  return (
    <li
      className="overflow-hidden rounded-card border border-hair-soft bg-panel"
      aria-hidden="true"
    >
      <div className="aspect-video bg-panel-3" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="shimmer-bar h-2.5 w-2/5 rounded-sm" />
        <div className="shimmer-bar h-5 w-11/12 rounded-sm" />
        <div className="shimmer-bar h-2.5 w-full rounded-sm" />
        <div className="shimmer-bar h-2.5 w-3/4 rounded-sm" />
      </div>
    </li>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,296px),1fr))] gap-4">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </ul>
  );
}

export function Notice({
  title,
  body,
  variant = "default",
  children,
}: {
  title: string;
  body: string;
  variant?: "default" | "error";
  children?: ReactNode;
}) {
  return (
    <div
      className={`col-span-full flex flex-col items-start gap-3 rounded-card border border-dashed bg-panel p-6 ${
        variant === "error" ? "border-alert/50" : "border-hair"
      }`}
    >
      <h3
        className={`font-display text-h2 leading-tight font-bold ${
          variant === "error" ? "text-alert" : "text-chalk"
        }`}
      >
        {title}
      </h3>
      <p className="max-w-[52ch] text-dim">{body}</p>
      {children}
    </div>
  );
}
