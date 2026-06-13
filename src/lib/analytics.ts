/**
 * Product analytics (PRD §18). A dependency-free PostHog capture scaffold:
 * no-op until NEXT_PUBLIC_POSTHOG_KEY is set, at which point events POST to the
 * capture API. Swap in posthog-js later for autocapture/flags/replay. Learning
 * *evidence* lives in Postgres (reading_sessions, etc.), not here.
 */
const ANON_KEY = "rtl.anon_id";

function distinctId(): string {
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function track(event: string, properties: Record<string, unknown> = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return; // no-op without a key
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  try {
    void fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId(),
        properties,
      }),
    });
  } catch {
    /* analytics must never break the app */
  }
}
