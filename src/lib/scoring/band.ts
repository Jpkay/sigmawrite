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
