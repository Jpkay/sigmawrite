import { tokenize } from "./classify";

export type DictationMode = "flash" | "trous" | "choix" | "negociee" | "brevet";

export type BlankSpec = { index: number; answer: string; choices?: string[] };
export type SegmentTemplate = { index: number; tokens: string[]; blanks: BlankSpec[] };

const GRAMMATICAL_TARGET = /(?:s|x|ent|aient|ait|é|és|ée|ées|er|ez|ont|a|à|est|et|son|sont|on|ce|se|ces|ses|ou|où|la|là|leur|leurs|tout|tous|toute|toutes|quand|quant)$/u;
const HOMOPHONES = new Set(["a", "à", "et", "est", "son", "sont", "on", "ont", "ce", "se", "ces", "ses", "ou", "où", "la", "là", "leur", "leurs", "tout", "tous", "toute", "toutes", "quand", "quant", "mes", "mais", "peu", "peut", "sans", "s’en", "dans", "d’en", "ni", "n’y", "si", "s’y"]);

const strip = (token: string) => token.replace(/^[«"(\[]+|[.,;:!?»")\]…]+$/gu, "");

/** Deterministic hash so a dictée always hides the same words for every student. */
function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) { h ^= char.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

/**
 * Chooses the words to hide for dictée à trous / à choix: homophones and
 * grammatically marked words first, then long words, about a third of the
 * segment. Punctuation stays attached to the visible template.
 */
export function buildTemplate(segmentText: string, index: number): SegmentTemplate {
  const tokens = tokenize(segmentText);
  const candidates = tokens.map((token, position) => ({ position, word: strip(token), lower: strip(token).toLocaleLowerCase("fr") }))
    .filter((entry) => entry.word.length > 0 && !/’$/u.test(entry.word))
    .map((entry) => ({ ...entry, priority: HOMOPHONES.has(entry.lower) ? 3 : GRAMMATICAL_TARGET.test(entry.lower) && entry.word.length >= 4 ? 2 : entry.word.length >= 7 ? 1 : 0 }))
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => b.priority - a.priority || hash(`${index}:${a.position}`) - hash(`${index}:${b.position}`));
  const budget = Math.max(1, Math.round(tokens.length * 0.33));
  const chosen = candidates.slice(0, budget).sort((a, b) => a.position - b.position);
  return { index, tokens, blanks: chosen.map((entry) => ({ index: entry.position, answer: entry.word })) };
}

/** Plausible misspellings for a blank: homophone siblings first, then rule-based variants. */
export function distractorsFor(answer: string): string[] {
  const lower = answer.toLocaleLowerCase("fr");
  const keepCase = (variant: string) => (answer[0] === answer[0].toLocaleUpperCase("fr") && answer[0] !== answer[0].toLocaleLowerCase("fr") ? variant[0].toLocaleUpperCase("fr") + variant.slice(1) : variant);
  const pool: string[] = [];
  const groups = [["a", "à"], ["et", "est"], ["son", "sont"], ["on", "ont"], ["ce", "se"], ["ces", "ses", "c’est", "s’est"], ["ou", "où"], ["la", "là"], ["leur", "leurs"], ["tout", "tous", "toute", "toutes"], ["quand", "quant"], ["mes", "mais"], ["peu", "peut"], ["sans", "s’en"], ["dans", "d’en"], ["ni", "n’y"], ["si", "s’y"]];
  for (const group of groups) if (group.includes(lower)) pool.push(...group.filter((word) => word !== lower));
  if (lower.endsWith("s")) pool.push(lower.slice(0, -1)); else pool.push(lower + "s");
  if (lower.endsWith("é")) pool.push(lower.slice(0, -1) + "er", lower + "e", lower + "s");
  else if (lower.endsWith("er")) pool.push(lower.slice(0, -2) + "é");
  else if (lower.endsWith("ée")) pool.push(lower.slice(0, -1), lower.slice(0, -2) + "er");
  else if (lower.endsWith("és")) pool.push(lower.slice(0, -1), lower.slice(0, -2) + "er");
  if (lower.endsWith("ent")) pool.push(lower.slice(0, -3) + "e", lower.slice(0, -2) + "t");
  else if (lower.endsWith("aient")) pool.push(lower.slice(0, -4) + "t", lower.slice(0, -3) + "ent");
  else if (lower.endsWith("ait")) pool.push(lower.slice(0, -3) + "aient", lower.slice(0, -1) + "s");
  const deaccented = lower.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").normalize("NFC");
  if (deaccented !== lower) pool.push(deaccented);
  const unique = [...new Set(pool.map(keepCase))].filter((variant) => variant !== answer && variant.length > 0);
  return unique.slice(0, 2);
}

/** Learner-visible template: hidden words replaced by blanks; answers never leave the server. */
export function publicTemplate(template: SegmentTemplate, withChoices: boolean) {
  return {
    index: template.index,
    tokens: template.tokens.map((token, position) => (template.blanks.some((blank) => blank.index === position) ? null : token)),
    blanks: template.blanks.map((blank) => ({ index: blank.index, choices: withChoices ? shuffle([blank.answer, ...distractorsFor(blank.answer)], hash(`${template.index}:${blank.index}:${blank.answer}`)) : undefined })),
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) { state = (Math.imul(state, 1103515245) + 12345) >>> 0; const j = state % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Rebuild the learner's full segment from a template plus their blank fills, preserving punctuation. */
export function reconstruct(template: SegmentTemplate, fills: Record<number, string>): string {
  const words = template.tokens.map((token, position) => {
    const blank = template.blanks.find((entry) => entry.index === position);
    if (!blank) return token;
    const fill = (fills[position] ?? "").trim();
    const prefix = token.slice(0, token.length - token.replace(/^[«"(\[]+/u, "").length);
    const suffix = token.slice(token.replace(/[.,;:!?»")\]…]+$/u, "").length);
    return `${prefix}${fill}${suffix}`;
  });
  return words.join(" ").replace(/’ /gu, "’");
}
