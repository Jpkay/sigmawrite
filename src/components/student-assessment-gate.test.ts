import { describe, expect, it } from "vitest";
import { studentAssessmentRedirect } from "./student-assessment-gate";

describe("student assessment-first route gate", () => {
  it("sends a new learner to onboarding", () => {
    expect(studentAssessmentRedirect({ pathname: "/student/vocabulary", onboarded: false, diagnosticComplete: false }))
      .toBe("/student/onboarding");
  });

  it("sends an onboarded learner to the required diagnostic", () => {
    expect(studentAssessmentRedirect({ pathname: "/student/memory", onboarded: true, diagnosticComplete: false }))
      .toBe("/student/diagnostic");
  });

  it("keeps onboarding, diagnostic, and settings reachable", () => {
    expect(studentAssessmentRedirect({ pathname: "/student/diagnostic", onboarded: true, diagnosticComplete: false })).toBeNull();
    expect(studentAssessmentRedirect({ pathname: "/student/settings", onboarded: false, diagnosticComplete: false })).toBeNull();
  });

  it("unlocks the student area after completion", () => {
    expect(studentAssessmentRedirect({ pathname: "/student/frontier", onboarded: true, diagnosticComplete: true })).toBeNull();
  });

  it("limits a provisional pilot result to its diagnostic and frontier preview", () => {
    expect(studentAssessmentRedirect({ pathname: "/student/frontier", onboarded: true, diagnosticComplete: true, diagnosticProvisional: true })).toBeNull();
    expect(studentAssessmentRedirect({ pathname: "/student/vocabulary", onboarded: true, diagnosticComplete: true, diagnosticProvisional: true })).toBe("/student/diagnostic");
  });
});
