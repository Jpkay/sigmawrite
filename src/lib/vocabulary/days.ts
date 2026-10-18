/** Calendar-day helpers. Students live in France, so "a day" is a Paris day. */
export const MEMORY_TIME_ZONE = "Europe/Paris";
const DAY_MS = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let value = formatters.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(timeZone, value);
  }
  return value;
}

/** YYYY-MM-DD of the instant in the given time zone. */
export function localDay(at: string | number | Date, timeZone = MEMORY_TIME_ZONE): string {
  const date = at instanceof Date ? at : new Date(at);
  return formatter(timeZone).format(date);
}

/** Whole days between two YYYY-MM-DD strings (b − a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function elapsedDays(from: string | null | undefined, to: string | number | Date): number {
  if (!from) return 0;
  const end = to instanceof Date ? to.getTime() : typeof to === "number" ? to : Date.parse(to);
  return Math.max(0, (end - Date.parse(from)) / DAY_MS);
}

export function sameLocalDay(a: string | null | undefined, b: string | number | Date, timeZone = MEMORY_TIME_ZONE): boolean {
  return !!a && localDay(a, timeZone) === localDay(b, timeZone);
}
