/**
 * Wall-clock reads for server components. Server components render once per
 * request, so reading the clock is safe — but it must not happen in a client
 * render body. Centralising it here keeps that intent explicit.
 */
export const nowMs = (): number => Date.now();
