import { createHash } from "node:crypto";
import { RUBRIC_DIMENSIONS } from "./rubric";

/**
 * Blind panel tooling (roadmap H.12): mix generated chapters with reference
 * texts for the same age, anonymise them, then score the panel's answers.
 * Passing target per pipeline version: generated texts ≥ 4/5 on average and
 * spotted as AI no more than ~60% of the time. Never blocks a student story.
 */

export type PanelSource = { text: string; isGenerated: boolean; origin: string };
export type PanelItem = { code: string; text: string };
export type PanelKey = { code: string; isGenerated: boolean; origin: string };

function seededShuffle<T>(items: T[], seed: string): T[] {
  return items.map((item, index) => ({ item, rank: createHash("sha256").update(`${seed}:${index}`).digest().readUInt32BE(0) }))
    .sort((a, b) => a.rank - b.rank).map((entry) => entry.item);
}

/** Codes are random-looking but reproducible from the panel key; origin never appears in the rater sheet. */
export function buildPanel(sources: PanelSource[], panelKey: string): { items: PanelItem[]; key: PanelKey[] } {
  const shuffled = seededShuffle(sources, panelKey);
  const key: PanelKey[] = [];
  const items = shuffled.map((source, index) => {
    const code = `T${String(index + 1).padStart(2, "0")}-${createHash("sha256").update(`${panelKey}:${index}`).digest("hex").slice(0, 4)}`;
    key.push({ code, isGenerated: source.isGenerated, origin: source.origin });
    return { code, text: source.text.replace(/\{\{HEROS\}\}/gu, "Camille").replace(/\{\{m:([^|{}]*)\|f:([^{}]*)\}\}/gu, "$2") };
  });
  return { items, key };
}

export const PANEL_SHEET_HEADER = ["code", "rater", "overall", ...RUBRIC_DIMENSIONS.map((d) => d.key), "guessed_generated"];

export type PanelScore = { code: string; rater: string; overall: number; rubric: Record<string, number>; guessedGenerated: boolean | null };

export function parsePanelSheet(csv: string): PanelScore[] {
  const lines = csv.split(/\r?\n/u).filter((l) => l.trim());
  // French spreadsheets export with ";" and decimal commas; fall back to "," otherwise.
  const separator = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(separator).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(separator).map((c) => c.trim());
    const get = (name: string) => cells[header.indexOf(name)] ?? "";
    const rubric: Record<string, number> = {};
    for (const d of RUBRIC_DIMENSIONS) { const v = Number(get(d.key).replace(",", ".")); if (Number.isFinite(v) && v > 0) rubric[d.key] = v; }
    const guess = get("guessed_generated").toLowerCase();
    return { code: get("code"), rater: get("rater"), overall: Number(get("overall").replace(",", ".")), rubric, guessedGenerated: ["oui", "yes", "1", "true", "ia"].includes(guess) ? true : ["non", "no", "0", "false", "humain"].includes(guess) ? false : null };
  }).filter((s) => s.code && s.rater && Number.isFinite(s.overall));
}

export type PanelResult = { generatedMean: number | null; referenceMean: number | null; detectionRate: number | null; guesses: number; passed: boolean; perItem: Array<{ code: string; isGenerated: boolean; mean: number; raters: number }> };

export function scorePanel(scores: PanelScore[], key: PanelKey[], targets = { minMean: 4, maxDetection: 0.6 }): PanelResult {
  const byCode = new Map(key.map((k) => [k.code, k]));
  const perItem = key.map((k) => {
    const own = scores.filter((s) => s.code === k.code);
    return { code: k.code, isGenerated: k.isGenerated, mean: own.length ? own.reduce((a, s) => a + s.overall, 0) / own.length : NaN, raters: own.length };
  }).filter((i) => i.raters > 0);
  const mean = (values: number[]) => (values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null);
  const generatedScores = scores.filter((s) => byCode.get(s.code)?.isGenerated);
  const guesses = generatedScores.filter((s) => s.guessedGenerated !== null);
  const detectionRate = guesses.length ? Number((guesses.filter((s) => s.guessedGenerated).length / guesses.length).toFixed(3)) : null;
  const generatedMean = mean(generatedScores.map((s) => s.overall));
  return {
    generatedMean, referenceMean: mean(scores.filter((s) => byCode.get(s.code) && !byCode.get(s.code)!.isGenerated).map((s) => s.overall)),
    detectionRate, guesses: guesses.length,
    passed: generatedMean !== null && generatedMean >= targets.minMean && detectionRate !== null && detectionRate <= targets.maxDetection,
    perItem,
  };
}
