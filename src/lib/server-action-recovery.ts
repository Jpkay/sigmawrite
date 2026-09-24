export function isMissingServerActionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /Failed to find Server Action|Server Action ["'][^"']+["'] was not found on the server/i.test(message);
}
