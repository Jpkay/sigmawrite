import { randomBytes, randomUUID } from "node:crypto";

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
export const INTERNAL_ACCOUNT_DOMAIN = "accounts.sigmawrite.app";

export function normalizeRequestedUsername(value: string): string {
  const username = value.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Le nom d’utilisateur doit contenir 3 à 32 lettres minuscules, chiffres, points, tirets ou soulignements.");
  }
  return username;
}
export function usernameBase(displayName: string, fallback = "utilisateur"): string {
  const normalized = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  const safe = normalized.length >= 3 ? normalized : fallback.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return (safe.length >= 3 ? safe : "utilisateur").slice(0, 24);
}

export function generateTemporaryPassword(): string {
  return `Aa1!${randomBytes(12).toString("base64url")}`;
}

export function internalAuthEmail(): string {
  return `account+${randomUUID()}@${INTERNAL_ACCOUNT_DOMAIN}`;
}

export function isInternalAuthEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const normalized = email.toLowerCase();
  return normalized.endsWith(`@${INTERNAL_ACCOUNT_DOMAIN}`)
    || normalized.endsWith("@students.sigmawrite.app");
}
