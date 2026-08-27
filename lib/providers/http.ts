import { REQUEST_TIMEOUT_MS } from "../config";

export class ProviderError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

export function messageForStatus(status: number, provider: string): string {
  if (status === 401 || status === 403)
    return `${provider} rejected the credentials. Check the API key in your environment.`;
  if (status === 404) return `That collection isn't available on ${provider}.`;
  if (status === 426 || status === 429)
    return `${provider} is rate limiting requests. Try again shortly.`;
  if (status >= 500) return `${provider} is having trouble. Try again in a few seconds.`;
  return `${provider} returned an unexpected status (${status}).`;
}

export async function getJson<T>(
  url: string,
  { revalidate, provider }: { revalidate: number; provider: string },
): Promise<{ data: T; latencyMs: number }> {
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new ProviderError(
      timedOut ? `${provider} took too long to respond.` : `Couldn't reach ${provider}.`,
    );
  }

  if (!response.ok) {
    throw new ProviderError(messageForStatus(response.status, provider), response.status);
  }

  const body = await response.text();
  try {
    return { data: JSON.parse(body) as T, latencyMs: Date.now() - startedAt };
  } catch {
    throw new ProviderError(`${provider} returned a response that wasn't JSON.`);
  }
}
