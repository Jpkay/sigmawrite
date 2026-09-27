import { describe, expect, it } from "vitest";
import {
  CLASS_INVITE_CONFIG,
  classInviteInputSchema,
  normalizeInviteCode,
  supportsNoEmailJoin,
} from "@/lib/invite-config";

const classId = "12600000-0000-4000-8000-000000000001";

describe("class invitation configuration", () => {
  it("accepts the default bounded invitation", () => {
    expect(classInviteInputSchema.safeParse({
      classId,
      expiresInDays: CLASS_INVITE_CONFIG.defaultExpiresInDays,
      maxUses: CLASS_INVITE_CONFIG.defaultMaxUses,
    }).success).toBe(true);
  });

  it.each([
    { expiresInDays: 0, maxUses: 40 },
    { expiresInDays: 91, maxUses: 40 },
    { expiresInDays: 14, maxUses: 0 },
    { expiresInDays: 14, maxUses: 501 },
    { expiresInDays: 14.5, maxUses: 40 },
  ])("rejects out-of-bound settings: %j", (settings) => {
    expect(classInviteInputSchema.safeParse({ classId, ...settings }).success).toBe(false);
  });

  it("normalizes pasted codes and keeps legacy no-email joins bounded", () => {
    expect(normalizeInviteCode("  sw-ab12 cd34  ")).toBe("SW-AB12CD34");
    expect(supportsNoEmailJoin(`SW-${"A".repeat(32)}`)).toBe(true);
    expect(CLASS_INVITE_CONFIG.generatedCodeLength).toBe(35);
    expect(CLASS_INVITE_CONFIG.generatedCodeLength).toBeLessThanOrEqual(CLASS_INVITE_CONFIG.acceptedLegacyCodeMaxLength);
    expect(supportsNoEmailJoin("A".repeat(CLASS_INVITE_CONFIG.acceptedLegacyCodeMaxLength + 1))).toBe(false);
  });
});
