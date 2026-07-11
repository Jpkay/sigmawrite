import { describe, expect, it } from "vitest";
import { ageOnDate, canSelfConsent } from "@/lib/consent";

describe("consent age", () => {
  it("changes age on the birthday, not at the start of the year", () => {
    expect(ageOnDate("2011-07-11", new Date("2026-07-10T12:00:00Z"))).toBe(14);
    expect(ageOnDate("2011-07-10", new Date("2026-07-10T12:00:00Z"))).toBe(15);
  });

  it("requires a known date of birth and age 15", () => {
    expect(canSelfConsent(null, new Date("2026-07-10T00:00:00Z"))).toBe(false);
    expect(canSelfConsent("2012-01-01", new Date("2026-07-10T00:00:00Z"))).toBe(false);
    expect(canSelfConsent("2010-01-01", new Date("2026-07-10T00:00:00Z"))).toBe(true);
  });
});
