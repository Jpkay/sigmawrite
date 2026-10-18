import "server-only";
/**
 * Signed item tokens. The client never holds the answer of a recall item:
 * the expected word and the correct option travel sealed (HMAC-SHA256),
 * bound to the student and to a short lifetime, and the server grades.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ItemSecret } from "./types";

export type ItemClaims = ItemSecret & { sub: string; sid: string; iid: string; exp: number };

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.WORD_ITEM_SIGNING_SECRET ?? process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Word item signing secret is not configured.");
  return value;
}

const sign = (body: string) => createHmac("sha256", secret()).update(`word-item:v1:${body}`).digest("base64url");

export function sealItem(claims: Omit<ItemClaims, "exp">, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...claims, exp: now + TOKEN_TTL_MS }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verifies signature, owner and lifetime. Throws a student-safe message otherwise. */
export function openItem(token: string, studentId: string, now = Date.now()): ItemClaims {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Cette question a expiré. Recharge la page.");
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw new Error("Cette question a expiré. Recharge la page.");
  const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ItemClaims;
  if (claims.sub !== studentId || !(claims.exp > now)) throw new Error("Cette question a expiré. Recharge la page.");
  return claims;
}
