const INTERNAL_PATH = /^\/(?![\/\\])[^\s]*$/;

/** Accept only an application-internal path for post-auth navigation. */
export function safeAuthRedirect(value: string | null | undefined, fallback: string): string {
  if (!value || !INTERNAL_PATH.test(value)) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (!INTERNAL_PATH.test(decoded) || decoded.includes("\\")) return fallback;
    return value;
  } catch {
    return fallback;
  }
}
