import "server-only";

import { APP_NAME } from "../config";
import { gdelt } from "./gdelt";
import { newsapi } from "./newsapi";
import { snapi } from "./snapi";
import type { NewsProvider } from "./types";

export { ProviderError } from "./http";
export type { NewsProvider } from "./types";

const REGISTRY: Record<string, NewsProvider> = {
  [gdelt.id]: gdelt,
  [newsapi.id]: newsapi,
  [snapi.id]: snapi,
};

export const PROVIDER_IDS = Object.keys(REGISTRY);

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[${APP_NAME.toLowerCase()}] ${message}`);
}

export function getProvider(): NewsProvider {
  const requested = (process.env.NEWS_PROVIDER || gdelt.id).toLowerCase().trim();
  const chosen = REGISTRY[requested];

  if (!chosen) {
    warnOnce(
      `NEWS_PROVIDER="${requested}" is not a known provider (${PROVIDER_IDS.join(", ")}). Using ${gdelt.id}.`,
    );
    return gdelt;
  }

  if (chosen.keyEnvVar && !process.env[chosen.keyEnvVar]) {
    warnOnce(
      `${chosen.label} needs ${chosen.keyEnvVar} to be set. Falling back to ${gdelt.id}.`,
    );
    return gdelt;
  }

  return chosen;
}
