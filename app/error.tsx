"use client";

import { Notice } from "@/components/states";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="wrap py-12">
      <Notice
        title="Something went wrong"
        body={error.message || "The page failed to render. Reloading usually clears it."}
        variant="error"
      >
        <button type="button" onClick={reset} className="btn">
          Try again
        </button>
      </Notice>
    </main>
  );
}
