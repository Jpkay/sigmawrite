import { z } from "zod";

/** Shared limits for class invitations. New codes stay short while the join flow remains compatible with legacy codes. */
export const CLASS_INVITE_CONFIG = {
  defaultExpiresInDays: 14,
  defaultMaxUses: 40,
  expiresInDays: { min: 1, max: 90 },
  maxUses: { min: 1, max: 500 },
  generatedCodeLength: 35,
  acceptedLegacyCodeMaxLength: 64,
  expiryOptions: [7, 14, 30, 60, 90],
} as const;

export const classInviteInputSchema = z.object({
  classId: z.string().uuid(),
  expiresInDays: z.number().int()
    .min(CLASS_INVITE_CONFIG.expiresInDays.min)
    .max(CLASS_INVITE_CONFIG.expiresInDays.max),
  maxUses: z.number().int()
    .min(CLASS_INVITE_CONFIG.maxUses.min)
    .max(CLASS_INVITE_CONFIG.maxUses.max),
});

export function normalizeInviteCode(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function supportsNoEmailJoin(code: string): boolean {
  const length = normalizeInviteCode(code).length;
  return length >= 6 && length <= CLASS_INVITE_CONFIG.acceptedLegacyCodeMaxLength;
}
