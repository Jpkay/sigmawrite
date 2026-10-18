/**
 * School calendars for review planning (roadmap 2026-10 C.5).
 *
 * French holiday zones A, B and C plus a custom calendar (schools abroad,
 * local deviations). Periods are half-open: `start` is the first day without
 * class (the Saturday after "fin des cours"), `end` is the "jour de reprise".
 * Source: official calendars published by the Ministère de l'Éducation
 * nationale (education.gouv.fr, "calendrier scolaire") for 2025-2026 and
 * 2026-2027. The summer 2027 end date is provisional until the 2027-2028
 * calendar is confirmed. Beyond the listed years only custom periods apply;
 * add the next school year here when it is published.
 */
import { addDays, dayDiff, localDay } from "./days";

export type SchoolZone = "A" | "B" | "C";
export type HolidayPeriod = { start: string; end: string; label: string };

const all = (start: string, end: string, label: string): Record<SchoolZone, HolidayPeriod> => ({
  A: { start, end, label }, B: { start, end, label }, C: { start, end, label },
});
const zoned = (label: string, a: [string, string], b: [string, string], c: [string, string]): Record<SchoolZone, HolidayPeriod> => ({
  A: { start: a[0], end: a[1], label }, B: { start: b[0], end: b[1], label }, C: { start: c[0], end: c[1], label },
});

const PERIODS: Record<SchoolZone, HolidayPeriod>[] = [
  all("2025-07-05", "2025-09-01", "Vacances d’été"),
  all("2025-10-18", "2025-11-03", "Vacances de la Toussaint"),
  all("2025-12-20", "2026-01-05", "Vacances de Noël"),
  zoned("Vacances d’hiver", ["2026-02-07", "2026-02-23"], ["2026-02-14", "2026-03-02"], ["2026-02-21", "2026-03-09"]),
  zoned("Vacances de printemps", ["2026-04-04", "2026-04-20"], ["2026-04-11", "2026-04-27"], ["2026-04-18", "2026-05-04"]),
  all("2026-07-04", "2026-09-01", "Vacances d’été"),
  all("2026-10-17", "2026-11-02", "Vacances de la Toussaint"),
  all("2026-12-19", "2027-01-04", "Vacances de Noël"),
  zoned("Vacances d’hiver", ["2027-02-13", "2027-03-01"], ["2027-02-20", "2027-03-08"], ["2027-02-06", "2027-02-22"]),
  zoned("Vacances de printemps", ["2027-04-10", "2027-04-26"], ["2027-04-17", "2027-05-03"], ["2027-04-03", "2027-04-19"]),
  all("2027-07-03", "2027-09-01", "Vacances d’été"),
];

export const ZONE_HOLIDAYS: Record<SchoolZone, HolidayPeriod[]> = {
  A: PERIODS.map((period) => period.A),
  B: PERIODS.map((period) => period.B),
  C: PERIODS.map((period) => period.C),
};

export type CalendarSettings = {
  /** null = no calendar known: never pause, never ramp. */
  zone: SchoolZone | "custom" | null;
  customHolidays?: HolidayPeriod[];
  /** Student/teacher option: no reviews and no new words during holidays. */
  pauseDuringHolidays: boolean;
};

export const NO_CALENDAR: CalendarSettings = { zone: null, customHolidays: [], pauseDuringHolidays: false };

export function holidaysFor(settings: CalendarSettings): HolidayPeriod[] {
  const custom = settings.customHolidays ?? [];
  if (settings.zone === "A" || settings.zone === "B" || settings.zone === "C") return [...ZONE_HOLIDAYS[settings.zone], ...custom];
  return settings.zone === "custom" ? custom : [];
}

function mergedHolidays(settings: CalendarSettings): HolidayPeriod[] {
  const sorted = [...holidaysFor(settings)].sort((a, b) => a.start.localeCompare(b.start));
  const merged: HolidayPeriod[] = [];
  for (const period of sorted) {
    const last = merged[merged.length - 1];
    if (last && period.start <= last.end) { if (period.end > last.end) last.end = period.end; }
    else merged.push({ ...period });
  }
  return merged;
}

/** The holiday period containing a local day (YYYY-MM-DD), if any. */
export function holidayOn(day: string, settings: CalendarSettings): HolidayPeriod | null {
  return holidaysFor(settings).find((period) => day >= period.start && day < period.end) ?? null;
}

export function isPausedDay(day: string, settings: CalendarSettings): boolean {
  return settings.pauseDuringHolidays && holidayOn(day, settings) !== null;
}

/** Number of paused local days in (from, to]. Used to stretch due dates over a paused holiday. */
export function pausedDaysBetween(from: string | null | undefined, to: string | Date, settings: CalendarSettings): number {
  if (!from || !settings.pauseDuringHolidays) return 0;
  const start = localDay(from);
  const end = localDay(to);
  let count = 0;
  for (const period of mergedHolidays(settings)) {
    const overlapStart = period.start > addDays(start, 1) ? period.start : addDays(start, 1);
    const overlapEnd = period.end < addDays(end, 1) ? period.end : addDays(end, 1);
    if (overlapEnd > overlapStart) count += dayDiff(overlapStart, overlapEnd);
  }
  return count;
}

/** The most recent holiday that ended within `withinDays` days before (or on) `day`. */
export function recentHolidayEnd(day: string, settings: CalendarSettings, withinDays: number): HolidayPeriod | null {
  return holidaysFor(settings)
    .filter((period) => period.end <= day && dayDiff(period.end, day) < withinDays)
    .sort((a, b) => b.end.localeCompare(a.end))[0] ?? null;
}
