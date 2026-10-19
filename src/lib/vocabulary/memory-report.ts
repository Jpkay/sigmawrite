/**
 * Weekly memory-quality report (roadmap 2026-10 C.6). Pure: computed from
 * word_review_log rows. Reports, per trace: calibration (predicted vs
 * observed recall), real retention around 30 and 90 days, reviews per word
 * mastered, and student time on word reviews per day.
 */
import { calibration, type Calibration } from "./fsrs-params";
import { localDay } from "./days";
import type { WordFacet } from "./types";

export type ReportLogRow = {
  studentId: string;
  senseId: string;
  facet: WordFacet;
  reviewedAt: string;
  rating: number;
  countsForFsrs: boolean;
  elapsedDays: number | null;
  retrievabilityBefore: number | null;
  responseMs: number | null;
};

export const REPORT_WINDOWS = {
  retention30: [25, 35] as const,
  retention90: [75, 105] as const,
};

export type RetentionPoint = { count: number; rate: number | null };
export type FacetReport = {
  reviews: number;
  calibration: Calibration;
  retention30: RetentionPoint;
  retention90: RetentionPoint;
};
export type MemoryReport = {
  weekStart: string;
  weekEnd: string;
  students: number;
  facets: Record<WordFacet, FacetReport>;
  reviewsPerMasteredWord: number | null;
  masteredWords: number;
  reviewMinutesPerStudentDay: { median: number | null; p90: number | null; studentDays: number };
};

function retention(rows: ReportLogRow[], [low, high]: readonly [number, number]): RetentionPoint {
  const window = rows.filter((row) => row.elapsedDays != null && row.elapsedDays >= low && row.elapsedDays <= high);
  return { count: window.length, rate: window.length ? window.filter((row) => row.rating > 1).length / window.length : null };
}

function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/**
 * @param weekRows log rows of the reported week
 * @param masteredSenseReviews total review count (all time) for each sense reaching Maîtrisé/Ancré
 */
export function buildMemoryReport(input: { weekStart: string; weekEnd: string; weekRows: ReportLogRow[]; masteredSenseReviews: number[] }): MemoryReport {
  const counted = input.weekRows.filter((row) => row.countsForFsrs);
  const facet = (name: WordFacet): FacetReport => {
    const rows = counted.filter((row) => row.facet === name);
    const predictions = rows.filter((row) => row.retrievabilityBefore != null).map((row) => ({
      predicted: Math.min(1 - 1e-6, Math.max(1e-6, row.retrievabilityBefore!)),
      observed: (row.rating > 1 ? 1 : 0) as 0 | 1,
    }));
    return { reviews: rows.length, calibration: calibration(predictions), retention30: retention(rows, REPORT_WINDOWS.retention30), retention90: retention(rows, REPORT_WINDOWS.retention90) };
  };
  const perStudentDay = new Map<string, number>();
  for (const row of input.weekRows) {
    const key = `${row.studentId}:${localDay(row.reviewedAt)}`;
    perStudentDay.set(key, (perStudentDay.get(key) ?? 0) + Math.min(120_000, Math.max(0, row.responseMs ?? 0)));
  }
  const minutes = [...perStudentDay.values()].map((ms) => ms / 60_000);
  const mastered = input.masteredSenseReviews.length;
  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    students: new Set(input.weekRows.map((row) => row.studentId)).size,
    facets: { spelling: facet("spelling"), meaning: facet("meaning") },
    masteredWords: mastered,
    reviewsPerMasteredWord: mastered ? input.masteredSenseReviews.reduce((sum, value) => sum + value, 0) / mastered : null,
    reviewMinutesPerStudentDay: { median: quantile(minutes, 0.5), p90: quantile(minutes, 0.9), studentDays: minutes.length },
  };
}

/** Flat PostHog properties (all keys allow-listed in analytics-privacy). */
export function reportEvents(report: MemoryReport): Array<Record<string, number | string>> {
  return (["spelling", "meaning"] as const).map((facet) => {
    const data = report.facets[facet];
    const props: Record<string, number | string> = { facet, week_start: report.weekStart, sample_size: data.reviews };
    if (data.calibration.logLoss != null) props.log_loss = Number(data.calibration.logLoss.toFixed(4));
    if (data.calibration.rmseBins != null) props.rmse_bins = Number(data.calibration.rmseBins.toFixed(4));
    if (data.retention30.rate != null) props.retention_30 = Number(data.retention30.rate.toFixed(3));
    if (data.retention90.rate != null) props.retention_90 = Number(data.retention90.rate.toFixed(3));
    if (report.reviewsPerMasteredWord != null) props.reviews_per_mastered = Number(report.reviewsPerMasteredWord.toFixed(2));
    if (report.reviewMinutesPerStudentDay.median != null) props.review_minutes_median = Number(report.reviewMinutesPerStudentDay.median.toFixed(2));
    return props;
  });
}
