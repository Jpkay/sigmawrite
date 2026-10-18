import { createHash } from "node:crypto";

/**
 * Continuous audit (roadmap H.15) — after publication, never before.
 *  - daily: a stronger reviewer re-scores a random 1–2% sample of live
 *    chapters plus every reported chapter;
 *  - alert rules on quality drops and report spikes;
 *  - an alert automatically switches live generation to library texts;
 *  - weekly human reading of the worst / reported texts improves prompts,
 *    style cards and the AI-tells list, but never gates content.
 */

export const AUDIT_POLICY = {
  sampleRate: Number(process.env.EDITORIAL_AUDIT_SAMPLE_RATE ?? 0.015),
  /** Mean auditor rubric score over the window below which live generation switches to library. */
  minMeanScore: 3.6,
  /** Share of audited chapters scoring < 3 that triggers the switch. */
  maxPoorShare: 0.1,
  /** Reports per published chapter above which the switch triggers (target < 0.5%). */
  maxReportRate: 0.01,
  /** Fallback share above which an alert is raised (no switch: fallbacks are already safe). */
  maxFallbackRate: 0.05,
  minSampleForAlert: 20,
};

/** Deterministic sampling: the same chapter id always gives the same answer for a given day. */
export function isSampled(chapterId: string, day: string, rate = AUDIT_POLICY.sampleRate): boolean {
  const hash = createHash("sha256").update(`${day}:${chapterId}`).digest();
  return hash.readUInt32BE(0) / 0xffffffff < rate;
}

export type AuditWindow = { audited: number[]; publishedChapters: number; reports: number; fallbacks: number };
export type AuditAlert = { kind: "quality_drop" | "poor_share" | "report_spike" | "fallback_rate"; value: number; threshold: number; switchToLibrary: boolean };

export function evaluateAuditWindow(window: AuditWindow, policy = AUDIT_POLICY): AuditAlert[] {
  const alerts: AuditAlert[] = [];
  if (window.audited.length >= policy.minSampleForAlert) {
    const mean = window.audited.reduce((a, b) => a + b, 0) / window.audited.length;
    if (mean < policy.minMeanScore) alerts.push({ kind: "quality_drop", value: Number(mean.toFixed(2)), threshold: policy.minMeanScore, switchToLibrary: true });
    const poor = window.audited.filter((s) => s < 3).length / window.audited.length;
    if (poor > policy.maxPoorShare) alerts.push({ kind: "poor_share", value: Number(poor.toFixed(3)), threshold: policy.maxPoorShare, switchToLibrary: true });
  }
  if (window.publishedChapters >= policy.minSampleForAlert) {
    const reportRate = window.reports / window.publishedChapters;
    if (reportRate > policy.maxReportRate) alerts.push({ kind: "report_spike", value: Number(reportRate.toFixed(4)), threshold: policy.maxReportRate, switchToLibrary: true });
    const fallbackRate = window.fallbacks / (window.publishedChapters + window.fallbacks || 1);
    if (fallbackRate > policy.maxFallbackRate) alerts.push({ kind: "fallback_rate", value: Number(fallbackRate.toFixed(3)), threshold: policy.maxFallbackRate, switchToLibrary: false });
  }
  return alerts;
}
