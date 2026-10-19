import { describe, expect, it } from "vitest";
import { default_w } from "ts-fsrs";
import { alignProduction, freeWritingUses, normalizeWord, sentenceContaining } from "./matching";
import { calibration, cohortForGrade, holdoutCalibration, holdoutSplit, predictHistory, selectParameterSet, shouldAdopt, type ParameterSet, type ReviewEvent } from "./fsrs-params";
import { buildMemoryReport, reportEvents } from "./memory-report";
import { sanitizeAnalyticsProperties } from "@/lib/analytics-privacy";

describe("matching", () => {
  it("normalises elisions, apostrophes and punctuation", () => {
    expect(normalizeWord("L’intrépide,")).toBe("intrépide");
    expect(normalizeWord("«Aujourd’hui»")).toBe("aujourd'hui");
  });
  it("labels each expected word of a production", () => {
    const words = alignProduction("Le héros intrépide court.", "le heros intrépid");
    expect(words.map((word) => [word.normalized, word.outcome])).toEqual([["le", "exact"], ["héros", "accent"], ["intrépide", "misspelled"], ["court", "missing"]]);
  });
  it("never flags a valid French form as a misspelling", () => {
    const uses = freeWritingUses("La porte est fermée et il porté son sac.", new Set(["porté"]), new Set(["porte", "fermée", "est", "la", "et", "il", "son", "sac"]));
    expect(uses).toEqual([{ form: "porté", token: "porté", outcome: "exact" }]);
  });
  it("finds the sentence where a word was first met", () => {
    expect(sentenceContaining(["Il pleut. Le capitaine, intrépide, avance !"], new Set(["intrépide"]))).toBe("Le capitaine, intrépide, avance !");
  });
});

describe("FSRS parameters (C.3)", () => {
  const sets: ParameterSet[] = [
    { version: "cohort-cm", scope: "cohort", cohortKey: "cm", facet: "spelling", studentId: null, weights: [...default_w], status: "active" },
    { version: "student-a", scope: "student", cohortKey: null, facet: "spelling", studentId: "a", weights: [...default_w], status: "active" },
    { version: "student-b-old", scope: "student", cohortKey: null, facet: "spelling", studentId: "b", weights: [...default_w], status: "retired" },
  ];
  it("selects student, then age group, then defaults", () => {
    expect(selectParameterSet(sets, { studentId: "a", grade: 4, facet: "spelling" }).version).toBe("student-a");
    expect(selectParameterSet(sets, { studentId: "b", grade: 5, facet: "spelling" }).version).toBe("cohort-cm");
    expect(selectParameterSet(sets, { studentId: "b", grade: 9, facet: "spelling" }).scope).toBe("default");
    expect(selectParameterSet(sets, { studentId: "a", grade: 4, facet: "meaning" }).scope).toBe("default");
    expect([cohortForGrade(4), cohortForGrade(7), cohortForGrade(9)]).toEqual(["cm", "6e5e", "4e3e"]);
  });

  const events: ReviewEvent[] = [];
  for (let card = 0; card < 40; card++) {
    let day = 0;
    for (const [index, rating] of [3, 3, card % 4 === 0 ? 1 : 3, 3, 3].entries()) {
      events.push({ cardId: `c${card}`, studentId: "a", facet: "spelling", at: new Date(Date.UTC(2026, 0, 1 + day, 10)).toISOString(), rating: rating as 1 | 3 });
      day += [3, 10, 30, 60, 90][index];
    }
  }
  it("computes log-loss and RMSE by bin for a parameter set", () => {
    const report = calibration(predictHistory(events, default_w));
    expect(report.count).toBe(160);
    expect(report.logLoss).toBeGreaterThan(0);
    expect(report.rmseBins).toBeGreaterThanOrEqual(0);
    expect(report.bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(160);
  });
  it("adopts fitted parameters only when they predict held-out reviews better", () => {
    const { boundary } = holdoutSplit(events);
    const current = holdoutCalibration(events, default_w, boundary);
    const worse = default_w.map((value, index) => (index < 4 ? value / 20 : value));
    const bad = holdoutCalibration(events, worse, boundary);
    expect(current.count).toBeGreaterThan(0);
    expect(shouldAdopt(current, bad)).toBe(false);
    expect(shouldAdopt(bad, current)).toBe(true);
  });
});

describe("weekly memory report (C.6)", () => {
  it("summarises calibration, retention, reviews per mastered word and time", () => {
    const rows = [
      { studentId: "a", senseId: "s1", facet: "spelling" as const, reviewedAt: "2026-10-12T10:00:00Z", rating: 3, countsForFsrs: true, elapsedDays: 30, retrievabilityBefore: 0.9, responseMs: 6000 },
      { studentId: "a", senseId: "s2", facet: "spelling" as const, reviewedAt: "2026-10-12T10:01:00Z", rating: 1, countsForFsrs: true, elapsedDays: 28, retrievabilityBefore: 0.85, responseMs: 9000 },
      { studentId: "b", senseId: "s1", facet: "meaning" as const, reviewedAt: "2026-10-13T10:00:00Z", rating: 3, countsForFsrs: true, elapsedDays: 90, retrievabilityBefore: 0.8, responseMs: 12000 },
      { studentId: "b", senseId: "s1", facet: "meaning" as const, reviewedAt: "2026-10-13T10:02:00Z", rating: 3, countsForFsrs: false, elapsedDays: 0, retrievabilityBefore: null, responseMs: 3000 },
    ];
    const report = buildMemoryReport({ weekStart: "2026-10-12", weekEnd: "2026-10-19", weekRows: rows, masteredSenseReviews: [6, 8] });
    expect(report.facets.spelling.retention30).toEqual({ count: 2, rate: 0.5 });
    expect(report.facets.meaning.retention90).toEqual({ count: 1, rate: 1 });
    expect(report.facets.meaning.reviews).toBe(1);
    expect(report.reviewsPerMasteredWord).toBe(7);
    expect(report.reviewMinutesPerStudentDay.studentDays).toBe(2);
    const events = reportEvents(report);
    expect(events).toHaveLength(2);
    // Every property survives the analytics allow-list.
    for (const event of events) expect(Object.keys(sanitizeAnalyticsProperties(event)).sort()).toEqual(Object.keys(event).sort());
  });
});
