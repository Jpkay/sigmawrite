import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";

/**
 * Parent/teacher reporting (PRD §M, §N). Pure functions over a student's
 * persisted `app_state` document, so they work the same on the server
 * (dashboards) and in tests. No fake precision — bands and confidence come
 * straight from the diagnostic.
 */
export type StudentSnapshot = {
  onboarded?: boolean;
  diagnostic?: DiagnosticResult | null;
  sessions?: ReadingSessionResult[];
  skillEstimates?: Record<string, { ability: number; uncertainty: number; evidenceCount: number }>;
  vocab?: Record<string, { exposures: number; lastSeenAt: string }>;
  retrievalCards?: { repetitions: number }[];
};

const SKILL_KEY_LABELS: Record<string, string> = {
  literal_comprehension: "Compréhension littérale",
  main_idea: "Idée principale",
  inference: "Inférence",
  evidence_selection: "Sélection de preuves",
  cause_consequence: "Cause et conséquence",
  compare_contrast: "Comparer et opposer",
  academic_connectors: "Connecteurs académiques",
  sentence_parsing: "Analyse de phrases",
  pronoun_reference: "Suivi des références",
  vocabulary_in_context: "Vocabulaire en contexte",
  summarization: "Résumé",
  argument_structure: "Structure argumentative",
  disciplinary_vocabulary: "Vocabulaire disciplinaire",
  reading_stamina: "Endurance de lecture",
};

export const skillLabel = (key: string) => SKILL_KEY_LABELS[key] ?? key;

const WEEK_MS = 7 * 86_400_000;

export type WeeklyReport = {
  hasProfile: boolean;
  band: string;
  confidence: string;
  textsCompleted: number;
  minutes: number;
  avgSuccess: number | null;
  vocabCount: number;
  retrievalReviewed: number;
  strengths: string[];
  needsWork: string[];
};

export function weeklyReport(snap: StudentSnapshot, nowMs: number): WeeklyReport {
  const sessions = snap.sessions ?? [];
  const recent = sessions.filter((s) => {
    const t = Date.parse(s.completedAt ?? s.startedAt);
    return !Number.isNaN(t) && nowMs - t <= WEEK_MS;
  });
  const minutes = Math.round(
    recent.reduce((m, s) => m + (s.timeOnTaskSeconds ?? 0), 0) / 60
  );
  const avgSuccess = recent.length
    ? recent.reduce((a, s) => a + s.successRate, 0) / recent.length
    : null;

  const skills = snap.skillEstimates ?? {};
  const strengths = Object.entries(skills)
    .filter(([, v]) => v.ability >= 65)
    .map(([k]) => skillLabel(k));
  const needsWork = Object.entries(skills)
    .filter(([, v]) => v.ability < 50)
    .map(([k]) => skillLabel(k));

  const band = snap.diagnostic?.overallReadingBand;

  return {
    hasProfile: !!snap.diagnostic,
    band: band ? `Grade ${band.minGrade.toFixed(1)}–${band.maxGrade.toFixed(1)}` : "—",
    confidence: band?.confidence ?? "—",
    textsCompleted: recent.length,
    minutes,
    avgSuccess,
    vocabCount: Object.keys(snap.vocab ?? {}).length,
    retrievalReviewed: (snap.retrievalCards ?? []).filter((c) => c.repetitions > 0).length,
    strengths,
    needsWork,
  };
}

export type ProofBucket = { title: string; band: string; success: number }[];

/**
 * The parent "proof layer" (PRD §M): texts the child reads comfortably, with
 * support, or that are still too hard — from real session success.
 */
export function proofLayer(snap: StudentSnapshot): {
  comfortable: ProofBucket;
  withSupport: ProofBucket;
  tooHard: ProofBucket;
} {
  const comfortable: ProofBucket = [];
  const withSupport: ProofBucket = [];
  const tooHard: ProofBucket = [];
  for (const s of snap.sessions ?? []) {
    const text = SEED_TEXT_BY_ID[s.textVersionId];
    const entry = {
      title: text?.title ?? s.textVersionId,
      band: text?.difficultyBand ?? "—",
      success: Math.round(s.successRate * 100),
    };
    if (s.successRate >= 0.85) comfortable.push(entry);
    else if (s.successRate >= 0.7) withSupport.push(entry);
    else tooHard.push(entry);
  }
  return { comfortable, withSupport, tooHard };
}

/** Skills below mastery for one student (PRD §N skill gaps). */
export function skillGaps(snap: StudentSnapshot, threshold = 50): string[] {
  return Object.entries(snap.skillEstimates ?? {})
    .filter(([, v]) => v.ability < threshold)
    .map(([k]) => k);
}

// ─────────────────────────── Teacher aggregation (§N) ──────────────────────

export type StudentRow = { id: string; name: string; snap: StudentSnapshot };

export type ClassStudentSummary = {
  id: string;
  name: string;
  band: string;
  avgSuccess: number | null;
  textsThisWeek: number;
  lowEngagement: boolean;
};

export function classSummary(rows: StudentRow[], nowMs: number): ClassStudentSummary[] {
  return rows.map(({ id, name, snap }) => {
    const r = weeklyReport(snap, nowMs);
    return {
      id,
      name,
      band: r.band,
      avgSuccess: r.avgSuccess,
      textsThisWeek: r.textsCompleted,
      lowEngagement: r.textsCompleted === 0,
    };
  });
}

/** Intervention groups by shared skill gap (PRD §N grouping). */
export function recommendedGroups(
  rows: StudentRow[]
): { skillKey: string; label: string; studentNames: string[] }[] {
  const bySkill = new Map<string, string[]>();
  for (const { name, snap } of rows) {
    for (const skill of skillGaps(snap)) {
      bySkill.set(skill, [...(bySkill.get(skill) ?? []), name]);
    }
  }
  return [...bySkill.entries()]
    .map(([skillKey, studentNames]) => ({ skillKey, label: skillLabel(skillKey), studentNames }))
    .sort((a, b) => b.studentNames.length - a.studentNames.length);
}
