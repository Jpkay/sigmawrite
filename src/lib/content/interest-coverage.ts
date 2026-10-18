import { INTERESTS, INTEREST_GROUPS, interestGroupOf } from "./interests";

/**
 * Roadmap E.2: minimum content per interest offered. Pure functions only, so
 * the launch audit, the onboarding flag and the generation pipeline (E.3 /
 * H.17 library mode) all share one definition of "covered".
 */
export const INTEREST_COVERAGE_MINIMUMS = {
  /** Published reading passages per age band. */
  passagesPerBand: 6,
  /** Approved themed practice sentences per main skill family (all grades). */
  practicePerFamily: 20,
  /** Approved dictées per school grade. */
  dictationsPerGrade: 3,
} as const;

/** CM1–CM2, 6e–5e, 4e–3e (grade numbers: CM1 = 4 … 3e = 9). */
export const INTEREST_AGE_BANDS = ["cm", "6e_5e", "4e_3e"] as const;
export type InterestAgeBand = (typeof INTEREST_AGE_BANDS)[number];
export const INTEREST_AGE_BAND_LABELS: Record<InterestAgeBand, string> = { cm: "CM1–CM2", "6e_5e": "6e–5e", "4e_3e": "4e–3e" };
export const COVERAGE_GRADES = [4, 5, 6, 7, 8, 9] as const;
export type CoverageGrade = (typeof COVERAGE_GRADES)[number];

/** Main practice skill families and the competency strands they cover. */
export const PRACTICE_SKILL_FAMILIES = {
  conjugaison: ["conjugaison"],
  orthographe: ["orthographe_lexicale", "orthographe_grammaticale"],
  grammaire: ["grammaire_syntaxe"],
  vocabulaire: ["lexique"],
} as const;
export type PracticeSkillFamily = keyof typeof PRACTICE_SKILL_FAMILIES;
export const PRACTICE_SKILL_FAMILY_KEYS = Object.keys(PRACTICE_SKILL_FAMILIES) as PracticeSkillFamily[];

export function ageBandForGrade(grade: number): InterestAgeBand | null {
  if (grade === 4 || grade === 5) return "cm";
  if (grade === 6 || grade === 7) return "6e_5e";
  if (grade === 8 || grade === 9) return "4e_3e";
  return null;
}

/** "Foundation 5A" → cm, "Secondary 7B" → 6e_5e; lycée bands are out of scope. */
export function ageBandForDifficultyBand(band: string | null | undefined): InterestAgeBand | null {
  const grade = Number(/(\d+)/.exec(band ?? "")?.[1]);
  return Number.isFinite(grade) ? ageBandForGrade(grade) : null;
}

export function skillFamilyForStrand(strand: string | null | undefined): PracticeSkillFamily | null {
  for (const family of PRACTICE_SKILL_FAMILY_KEYS) {
    if ((PRACTICE_SKILL_FAMILIES[family] as readonly string[]).includes(strand ?? "")) return family;
  }
  return null;
}

export type InterestCoverageCounts = {
  passages: Record<string, Partial<Record<InterestAgeBand, number>>>;
  practice: Record<string, Partial<Record<PracticeSkillFamily, number>>>;
  dictations: Record<string, Partial<Record<CoverageGrade, number>>>;
};

export type InterestCoverageRows = {
  passages: ReadonlyArray<{ interest: string | null; difficultyBand: string | null }>;
  practice: ReadonlyArray<{ interestKeys: readonly string[]; strand: string | null }>;
  dictations: ReadonlyArray<{ interests: readonly string[]; gradeMin: number; gradeMax: number }>;
};

function bump<K extends string | number>(map: Record<string, Partial<Record<K, number>>>, interest: string, cell: K) {
  const row = (map[interest] ??= {});
  row[cell] = (row[cell] ?? 0) + 1;
}

/** Aggregates raw content rows into interest × cell counts. */
export function coverageCountsFromRows(rows: InterestCoverageRows): InterestCoverageCounts {
  const counts: InterestCoverageCounts = { passages: {}, practice: {}, dictations: {} };
  for (const row of rows.passages) {
    const band = ageBandForDifficultyBand(row.difficultyBand);
    if (row.interest && band) bump(counts.passages, row.interest, band);
  }
  for (const row of rows.practice) {
    const family = skillFamilyForStrand(row.strand);
    if (!family) continue;
    for (const interest of new Set(row.interestKeys)) bump(counts.practice, interest, family);
  }
  for (const row of rows.dictations) {
    for (const interest of new Set(row.interests)) {
      for (const grade of COVERAGE_GRADES) if (grade >= row.gradeMin && grade <= row.gradeMax) bump(counts.dictations, interest, grade);
    }
  }
  return counts;
}

export type InterestCoverageGap = {
  /** Interest key (or group key when evaluated at group level). */
  interest: string;
  type: "passage" | "practice" | "dictation";
  /** Age band, skill family or grade (as a string). */
  cell: string;
  have: number;
  need: number;
  missing: number;
};

export type InterestCoverageOptions = {
  /** Keys to evaluate. Default: every selectable interest. */
  targets?: readonly string[];
  /** "group" sums the member interests of each group target. */
  level?: "interest" | "group";
  /** Popularity (e.g. student_interests counts) used to order the gaps. */
  demand?: Readonly<Record<string, number>>;
};

function membersOf(target: string, level: "interest" | "group"): string[] {
  return level === "group" ? INTERESTS.filter((interest) => interest.group === target).map((interest) => interest.key) : [target];
}

function sum<K extends string | number>(map: Record<string, Partial<Record<K, number>>>, keys: string[], cell: K): number {
  return keys.reduce((total, key) => total + (map[key]?.[cell] ?? 0), 0);
}

/**
 * Every interest × band × type cell below its minimum, ordered for content
 * generation: most-demanded interest first, then passages before practice
 * before dictées, then youngest band / grade first. This is the function the
 * generation pipeline should call to know what to write next (E.3).
 */
export function missingInterestCoverage(counts: InterestCoverageCounts, options: InterestCoverageOptions = {}): InterestCoverageGap[] {
  const level = options.level ?? "interest";
  const targets = options.targets ?? (level === "group" ? INTEREST_GROUPS.map((group) => group.key) : INTERESTS.map((interest) => interest.key));
  const gaps: InterestCoverageGap[] = [];
  const push = (interest: string, type: InterestCoverageGap["type"], cell: string, have: number, need: number) => {
    if (have < need) gaps.push({ interest, type, cell, have, need, missing: need - have });
  };
  for (const target of targets) {
    const members = membersOf(target, level);
    for (const band of INTEREST_AGE_BANDS) push(target, "passage", band, sum(counts.passages, members, band), INTEREST_COVERAGE_MINIMUMS.passagesPerBand);
    for (const family of PRACTICE_SKILL_FAMILY_KEYS) push(target, "practice", family, sum(counts.practice, members, family), INTEREST_COVERAGE_MINIMUMS.practicePerFamily);
    for (const grade of COVERAGE_GRADES) push(target, "dictation", String(grade), sum(counts.dictations, members, grade), INTEREST_COVERAGE_MINIMUMS.dictationsPerGrade);
  }
  const demand = options.demand ?? {};
  const demandOf = (key: string) => level === "group" ? membersOf(key, "group").reduce((total, member) => total + (demand[member] ?? 0), 0) : demand[key] ?? 0;
  const typeOrder = { passage: 0, practice: 1, dictation: 2 } as const;
  const cellOrder = (gap: InterestCoverageGap) => gap.type === "passage" ? INTEREST_AGE_BANDS.indexOf(gap.cell as InterestAgeBand)
    : gap.type === "practice" ? PRACTICE_SKILL_FAMILY_KEYS.indexOf(gap.cell as PracticeSkillFamily) : Number(gap.cell);
  return gaps.sort((a, b) => demandOf(b.interest) - demandOf(a.interest)
    || targets.indexOf(a.interest) - targets.indexOf(b.interest)
    || typeOrder[a.type] - typeOrder[b.type]
    || cellOrder(a) - cellOrder(b));
}

export type InterestCoverageReport = {
  level: "interest" | "group";
  minimums: typeof INTEREST_COVERAGE_MINIMUMS;
  covered: string[];
  uncovered: Array<{ interest: string; missingCells: number; missingItems: number }>;
  /** True only when every target passes every cell. */
  allCovered: boolean;
  gaps: InterestCoverageGap[];
};

export function evaluateInterestCoverage(counts: InterestCoverageCounts, options: InterestCoverageOptions = {}): InterestCoverageReport {
  const level = options.level ?? "interest";
  const targets = options.targets ?? (level === "group" ? INTEREST_GROUPS.map((group) => group.key) : INTERESTS.map((interest) => interest.key));
  const gaps = missingInterestCoverage(counts, { ...options, level, targets });
  const byTarget = new Map<string, InterestCoverageGap[]>();
  for (const gap of gaps) byTarget.set(gap.interest, [...(byTarget.get(gap.interest) ?? []), gap]);
  return {
    level,
    minimums: INTEREST_COVERAGE_MINIMUMS,
    covered: targets.filter((target) => !byTarget.has(target)),
    uncovered: targets.filter((target) => byTarget.has(target)).map((interest) => ({
      interest,
      missingCells: byTarget.get(interest)!.length,
      missingItems: byTarget.get(interest)!.reduce((total, gap) => total + gap.missing, 0),
    })),
    allCovered: gaps.length === 0 && targets.length > 0,
    gaps,
  };
}

/**
 * E.6: the onboarding may promise "Tes textes partiront de là" only when every
 * interest offered passes E.2.
 */
export function interestPromiseKept(counts: InterestCoverageCounts, offered: readonly string[] = INTERESTS.map((interest) => interest.key)): boolean {
  return evaluateInterestCoverage(counts, { targets: offered }).allCovered;
}

/** Group a student's interest belongs to, re-exported for coverage callers. */
export { interestGroupOf };
