import { describe, expect, it } from "vitest";
import { BADGES, earnedBadges } from "./badges";

const none = { masteredNodes: 0, masteredStrands: 0, cleanDictations: 0, dictations: 0, demonstratedProductions: 0, streak: 0, reviews: 0, activeDaysThisWeek: 0 };

describe("earnedBadges", () => {
  it("defines at most twelve badges, none for time spent", () => {
    expect(BADGES.length).toBeLessThanOrEqual(12);
    expect(BADGES.some((badge) => /minute|heure|temps passé/iu.test(badge.description))).toBe(false);
  });
  it("awards nothing to a new student and stacks milestones", () => {
    expect(earnedBadges(none)).toEqual([]);
    expect(earnedBadges({ ...none, masteredNodes: 5, streak: 7 })).toEqual(["premiere_competence", "cinq_competences", "serie_sept"]);
  });
});
