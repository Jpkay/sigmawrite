import { splitSentences, tokenize } from "./stylometry";
import type { GradeBand } from "./types";

/**
 * Dictée-specific deterministic checks (roadmap H.17 "read aloud" and G.7).
 * Segments are the replay units stored in dictations.segments.
 */

const MAX_SEGMENT_WORDS: Record<GradeBand, number> = { cm: 8, "6e-5e": 12, "4e-3e": 16, lycee: 20 };

/** Homophone families that are unfair at the ear unless they are the point of the dictée. */
export const RISKY_HOMOPHONES: string[][] = [
  ["ver", "vers", "verre", "vert", "verts", "vertes", "verres"],
  ["mer", "mère", "maire"],
  ["sang", "cent", "sans", "sent", "s'en"],
  ["foi", "fois", "foie"],
  ["cou", "coup", "coût"],
  ["pain", "pin", "peint"],
  ["chêne", "chaîne"],
  ["conte", "compte", "comte"],
  ["saint", "sein", "sain", "ceint"],
  ["voie", "voix", "vois", "voit"],
];

export function segmentDictation(text: string, band: GradeBand): string[] {
  const max = MAX_SEGMENT_WORDS[band];
  const segments: string[] = [];
  for (const sentence of splitSentences(text.replace(/\n+/gu, " "))) {
    let rest = sentence.trim();
    // A little over the limit is fine; cutting "Le chat, silencieux, / pose sa patte" is not.
    while (tokenize(rest).length > max + 2) {
      const parts = rest.split(/(?<=,)\s+|\s+(?=(?:et|mais|puis|quand|qui|que|où)\s)/u);
      if (parts.length < 2) break;
      // Cut at the boundary closest to the middle of the sentence.
      const total = tokenize(rest).length;
      let acc = 0;
      let cut = 1;
      let best = Infinity;
      for (let i = 0; i < parts.length - 1; i += 1) {
        acc += tokenize(parts[i]).length;
        const distance = Math.abs(acc - total / 2);
        if (distance < best && acc >= 4 && total - acc >= 4) { best = distance; cut = i + 1; }
      }
      if (best === Infinity) break;
      const head = parts.slice(0, cut).join(" ").trim();
      if (!head || head === rest) break;
      segments.push(head);
      rest = rest.slice(rest.indexOf(head) + head.length).trim();
    }
    if (rest) segments.push(rest);
  }
  return segments;
}

export type DictationCheck = { passed: boolean; issues: string[]; homophones: string[] };

export function dictationChecks(text: string, segments: string[], band: GradeBand, lengthWords: { min: number; max: number }): DictationCheck {
  const issues: string[] = [];
  const words = tokenize(text).filter((t) => !t.endsWith("'")).length;
  if (/\d/u.test(text)) issues.push("chiffres à écrire en lettres");
  if (/^\s*[—–-]/mu.test(text)) issues.push("dialogue à tirets, difficile à dicter");
  if (/[()[\]/]|https?:/u.test(text)) issues.push("parenthèses, barres ou liens");
  if (/\b[A-Z]{2,}\b/u.test(text)) issues.push("sigles");
  if (segments.length < 1 || segments.length > 40) issues.push("nombre de segments hors limites");
  if (segments.some((s) => tokenize(s).length < 2)) issues.push("segment trop court pour avoir du sens à l'oral");
  if (segments.some((s) => tokenize(s).length > MAX_SEGMENT_WORDS[band] + 4)) issues.push("segment trop long à retenir");
  if (words < Math.floor(lengthWords.min * 0.85) || words > Math.ceil(lengthWords.max * 1.15)) issues.push(`${words} mots hors de la cible ${lengthWords.min}–${lengthWords.max}`);
  const tokens = new Set(tokenize(text).map((t) => t.replace(/'$/u, "")));
  const homophones = RISKY_HOMOPHONES.filter((family) => family.filter((w) => tokens.has(w)).length >= 1).map((family) => family.filter((w) => tokens.has(w)).join("/"));
  return { passed: issues.length === 0, issues, homophones };
}
