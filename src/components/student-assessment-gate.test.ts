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
    expect(studentAssessmentRedirect({ pathname: "/student/diagnostic/review", onboarded: false, diagnosticComplete: false })).toBeNull();
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

it("allows learning from a completed granular assessment without fabricating legacy section scores",()=>{
 expect(studentAssessmentRedirect({pathname:"/student/memory",onboarded:true,diagnosticComplete:false,diagnosticProvisional:true,granularDiagnosticReady:true})).toBeNull();
 expect(studentAssessmentRedirect({pathname:"/student/memory",onboarded:false,diagnosticComplete:false,granularDiagnosticReady:true})).toBeNull();
});

it("defers the lessons route to its authenticated server learning guard",()=>{
 expect(studentAssessmentRedirect({pathname:"/student/lessons",onboarded:false,diagnosticComplete:false})).toBeNull();
});

it("allows read-only progress previews after onboarding without unlocking learning",()=>{
 for(const pathname of ['/student/frontier','/student/progress']){
  expect(studentAssessmentRedirect({pathname,onboarded:true,diagnosticComplete:false,granularDiagnosticReady:false})).toBeNull();
  expect(studentAssessmentRedirect({pathname,onboarded:false,diagnosticComplete:false})).toBe('/student/onboarding');
 }
 for(const pathname of ['/student/memory','/student/vocabulary'])expect(studentAssessmentRedirect({pathname,onboarded:true,diagnosticComplete:false,granularDiagnosticReady:false})).toBe('/student/diagnostic');
});

it('keeps completed granular progress reachable without creating an onboarding marker',()=>{
 for(const pathname of ['/student/progress','/student/frontier','/student/memory']){
  expect(studentAssessmentRedirect({pathname,onboarded:false,diagnosticComplete:false,granularDiagnosticReady:true})).toBeNull();
  expect(studentAssessmentRedirect({pathname,onboarded:false,diagnosticComplete:false,granularDiagnosticReady:false})).toBe('/student/onboarding');
 }
});
