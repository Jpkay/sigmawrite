import type { DifficultyBand } from "@/lib/types";

/**
 * Maps an estimated reading grade to an internal difficulty band
 * (PRD §G — bands, not fake exact-grade precision).
 */
export function gradeToBand(grade: number): DifficultyBand {
  const g = Math.max(5, Math.min(11, grade));
  const whole = Math.floor(g);
  const half = g - whole >= 0.5 ? "B" : "A";
  if (whole <= 5) return half === "A" ? "Foundation 5A" : "Foundation 5B";
  if (whole === 6) return half === "A" ? "Foundation 6A" : "Foundation 6B";
  if (whole === 7) return half === "A" ? "Secondary 7A" : "Secondary 7B";
  if (whole === 8) return half === "A" ? "Secondary 8A" : "Secondary 8B";
  if (whole === 9) return half === "A" ? "Secondary 9A" : "Secondary 9B";
  if (whole === 10) return half === "A" ? "Secondary 10A" : "Secondary 10B";
  return "Advanced 11-12";
}

/** Human-facing label; the stored band remains stable for scoring and filters. */
export function difficultyBandLabel(band: string | null | undefined): string {
  if (!band) return "Niveau de lecture non défini";
  if (band === "Advanced 11-12") return "Lecture : 11e–12e année · avancé";
  const match = /^(?:Foundation|Secondary) (\d+)([AB])$/.exec(band);
  if (!match) return `Niveau de lecture : ${band}`;
  const [, grade, step] = match;
  return `Lecture : ${grade}e année · palier ${step === "A" ? "1" : "2"}`;
}

export type TargetLevelProfile = {
  gradeLabel: string;
  readerLabel: string;
  stageLabel: string;
  guidance: string;
  color: "green" | "blue" | "violet" | "neutral";
};

/** Reviewer-facing context: explains who the target reader is, not just the scoring code. */
export function targetLevelProfile(band: string | null | undefined): TargetLevelProfile {
  if (band === "Advanced 11-12") return {
    gradeLabel: "11e–12e année",
    readerLabel: "Lecteur de 16 à 18 ans",
    stageLabel: "Secondaire avancé",
    guidance: "Syntaxe élaborée, vocabulaire académique et inférences complexes.",
    color: "violet",
  };

  const match = /^(?:Foundation|Secondary) (\d+)([AB])$/.exec(band ?? "");
  if (!match) return {
    gradeLabel: "Niveau à confirmer",
    readerLabel: "Public cible non renseigné",
    stageLabel: "Niveau de lecture",
    guidance: "Vérifiez le niveau cible avant de poursuivre l’évaluation.",
    color: "neutral",
  };

  const grade = Number(match[1]);
  const step = match[2] === "A" ? "début d’année" : "fin d’année";
  const ages = `${grade + 5}–${grade + 6} ans`;
  if (grade <= 6) return {
    gradeLabel: `${grade}e année`,
    readerLabel: `Lecteur de ${ages}`,
    stageLabel: `Primaire · ${step}`,
    guidance: "Phrases accessibles, vocabulaire concret et compréhension principalement explicite.",
    color: "green",
  };
  if (grade <= 9) return {
    gradeLabel: `${grade}e année`,
    readerLabel: `Lecteur de ${ages}`,
    stageLabel: `Début du secondaire · ${step}`,
    guidance: "Vocabulaire scolaire intermédiaire et quelques inférences simples.",
    color: "blue",
  };
  return {
    gradeLabel: `${grade}e année`,
    readerLabel: `Lecteur de ${ages}`,
    stageLabel: `Secondaire avancé · ${step}`,
    guidance: "Vocabulaire académique, phrases plus longues et raisonnement implicite soutenu.",
    color: "violet",
  };
}
