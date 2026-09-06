import type { SpeechPart } from "@/lib/ai/provider";

/**
 * What the voice actually says (roadmap 1.2). In a French dictée the reader
 * announces punctuation while dictating segment by segment; the first,
 * whole-text listening is read naturally. Guillemets and line breaks are
 * announced the way teachers do.
 */
// Inserted separators use § so later rules never re-read them as real commas.
const SPOKEN: [RegExp, string][] = [
  [/\s*,/gu, "§ virgule§"],
  [/\s*…/gu, "§ points de suspension§"],
  [/\s*\.\.\./gu, "§ points de suspension§"],
  [/\s*\?/gu, "§ point d’interrogation§"],
  [/\s*!/gu, "§ point d’exclamation§"],
  [/\s*;/gu, "§ point-virgule§"],
  [/\s*:/gu, "§ deux-points§"],
  [/\s*«\s*/gu, "§ ouvrez les guillemets§ "],
  [/\s*»/gu, "§ fermez les guillemets§"],
  [/\s*\(/gu, "§ ouvrez la parenthèse§ "],
  [/\s*\)/gu, "§ fermez la parenthèse§"],
  [/\s+[–—]\s+/gu, "§ tiret§ "],
  [/\.(?=\s)/gu, "§ point§"],
];

/** Segment text with punctuation spoken; a final period becomes "point", or "point final" on the dictée's last segment. */
export function speakableSegment(text: string, options: { final?: boolean } = {}): string {
  let out = text.normalize("NFC").trim();
  const endsWithPeriod = /\.$/u.test(out);
  if (endsWithPeriod) out = out.slice(0, -1);
  for (const [pattern, spoken] of SPOKEN) out = out.replace(pattern, spoken);
  out = out.replace(/§(\s*§)+/gu, "§").replace(/§/gu, ",").replace(/\s{2,}/gu, " ").replace(/^,\s*/u, "").trim();
  return endsWithPeriod ? `${out}, ${options.final ? "point final" : "point"}.` : out;
}

/** Whole-text first listening: natural reading, no announced punctuation. */
export function speakableFullText(segments: string[]): string {
  return segments.map((segment) => segment.trim()).join(" ");
}

// ---------------------------------------------------------------------------
// Rendering hints for the speech backend (Kokoro-FastAPI inline tag syntax).
// Verified 2026-09-06: "[pause:Xs]" adds real silence; phoneme overrides are
// ignored for French; a comma between two words suppresses the liaison in
// the phonemizer ("les élèves, avaient" → no linking z).
// ---------------------------------------------------------------------------

const PAUSE = (seconds: number) => `[pause:${seconds}s]`;
const PUNCTUATION_WORDS = /\b(virgule|point d’interrogation|point d’exclamation|point-virgule|deux-points|points de suspension|ouvrez les guillemets|fermez les guillemets|ouvrez la parenthèse|fermez la parenthèse|tiret|point)\b/gu;

/**
 * Words after which a liaison is mandatory in standard French (determiners,
 * clitic pronouns, prenominal adjectives, short adverbs and prepositions,
 * monosyllabic verb forms). Everywhere else the model's liaison is wrong for a
 * dictée and we block it. Matched on the part after the last apostrophe, so
 * "qu’ils" and "n’est" resolve to "ils" and "est".
 */
const LIAISON_ALLOWED = new Set([
  "les", "des", "ces", "mes", "tes", "ses", "nos", "vos", "leurs", "aux", "un", "mon", "ton", "son", "cet", "aucun", "quelques", "plusieurs", "certains", "certaines", "autres", "mêmes", "tout", "tous", "toutes",
  "deux", "trois", "six", "dix", "vingt", "cent",
  "nous", "vous", "ils", "elles", "on", "en", "y",
  "très", "bien", "plus", "moins", "sans", "dans", "chez", "sous", "quand", "dont",
  "petit", "petits", "grand", "grands", "gros", "bon", "bons", "premier", "premiers", "dernier", "derniers", "ancien", "anciens", "nouveaux", "beaux", "vieux", "mauvais",
  "est", "sont", "ont", "vient", "faut",
]);
/** Common h-aspiré words: no liaison even after a determiner ("les | haricots"). */
const H_ASPIRE = /^(hach|hai|hal|ham|hanch|hand|hangar|hant|haricot|harp|hasard|hât|haut|hérisson|héros|hêtre|hibou|hockey|homard|hont|hoquet|hors|hou|huit|hurl|hutt)/iu;
const VOWEL_INITIAL = /^[«"(]*[aeiouyàâäéèêëîïôöùûüœhAEIOUYÀÂÉÈÊËÎÏÔÙÛÜŒH]/u;
const SILENT_FINAL = /[sxzdtn]$/iu;
const strip = (token: string) => {
  const word = token.replace(/[«»"(),.;:!?…]/gu, "").toLocaleLowerCase("fr");
  return word.slice(Math.max(word.lastIndexOf("’"), word.lastIndexOf("'")) + 1);
};
const bare = (token: string) => token.replace(/^[«"(]+/u, "").toLocaleLowerCase("fr");

/** Blocks non-mandatory liaisons with a comma so "les élèves avaient" is not heard as "élèvezavaient". */
export function guardLiaisons(text: string): string {
  const tokens = text.split(/(\s+)/u);
  for (let i = 0; i < tokens.length - 2; i += 2) {
    const word = strip(tokens[i]); const next = tokens[i + 2];
    if (!word || !next || tokens[i].startsWith("[")) continue;
    if (!SILENT_FINAL.test(word) || !VOWEL_INITIAL.test(next) || /[,.;:!?…]$/u.test(tokens[i])) continue;
    if (LIAISON_ALLOWED.has(word) && !H_ASPIRE.test(bare(next))) continue;
    tokens[i] = `${tokens[i]},`;
  }
  return tokens.join("");
}

/**
 * Final text sent to the voice: liaison guard, a beat before every announced
 * punctuation mark and a shorter one after.
 */
export function renderForSpeech(text: string, options: { beforePunctuation?: number; afterPunctuation?: number } = {}): string {
  const before = options.beforePunctuation ?? 0.5, after = options.afterPunctuation ?? 0.3;
  let out = guardLiaisons(text);
  out = out.replace(/,?\s+(?=(?:virgule|point|deux-points|points de suspension|ouvrez|fermez|tiret)\b)/gu, ` ${PAUSE(before)} `);
  out = out.replace(PUNCTUATION_WORDS, (word) => `${word} ${PAUSE(after)}`);
  return out.replace(/\[pause:[0-9.]+s\]\s*,/gu, (m) => m.replace(/\s*,$/u, "")).replace(/\s{2,}/gu, " ").replace(/\s+([.])/gu, "$1").trim();
}

// ---------------------------------------------------------------------------
// Speech plan: the voice reads the text; the punctuation words are spelled in
// phonemes (the model anglicises "point" from text) and real silences frame
// them. Verified 2026-09-06 with Kokoro ff_siwis.
// ---------------------------------------------------------------------------


const POINT = process.env.TTS_POINT_PHONEMES ?? "pwæ̃";
export const PUNCTUATION_PHONEMES: Record<string, string> = {
  "virgule": "viʁɡˈyl",
  "point": POINT,
  "point final": `${POINT} finˈal`,
  "point d’interrogation": `${POINT} dɛ̃tɛʁɔɡasjˈɔ̃`,
  "point d’exclamation": `${POINT} dɛksklamasjˈɔ̃`,
  "point-virgule": `${POINT} viʁɡˈyl`,
  "deux-points": `dø ${POINT}`,
  "points de suspension": `${POINT} də syspɑ̃sjˈɔ̃`,
  "ouvrez les guillemets": "uvʁˈe le ɡijmˈɛ",
  "fermez les guillemets": "fɛʁmˈe le ɡijmˈɛ",
  "ouvrez la parenthèse": "uvʁˈe la paʁɑ̃tˈɛz",
  "fermez la parenthèse": "fɛʁmˈe la paʁɑ̃tˈɛz",
  "tiret": "tiʁˈɛ",
};
const PUNCTUATION_ALTERNATION = new RegExp(`\\b(${Object.keys(PUNCTUATION_PHONEMES).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|")})\\b`, "gu");

/**
 * Splits a speakable segment into text chunks (liaison-guarded), phoneme
 * words and silences: 0.5 s before each punctuation word, 0.3 s after.
 */
export function buildSpeechPlan(speakable: string, options: { beforePunctuation?: number; afterPunctuation?: number } = {}): SpeechPart[] {
  const before = options.beforePunctuation ?? 0.5, after = options.afterPunctuation ?? 0.3;
  const guarded = guardLiaisons(speakable);
  const parts: SpeechPart[] = [];
  let last = 0;
  for (const match of guarded.matchAll(PUNCTUATION_ALTERNATION)) {
    const word = match[1]; const index = match.index ?? 0;
    const chunk = guarded.slice(last, index).replace(/^[,\s]+/u, "").replace(/[,\s]+$/u, "").trim();
    if (chunk) parts.push({ kind: "text", text: chunk });
    parts.push({ kind: "silence", seconds: before });
    if (word === "point final") {
      // End of the dictée (chosen by ear 2026-09-06): "point" in phonemes, a beat, then a
      // spoken closing sentence the text path can close with a falling contour.
      parts.push({ kind: "phonemes", phonemes: PUNCTUATION_PHONEMES.point, text: "point" });
      parts.push({ kind: "silence", seconds: 0.35 });
      parts.push({ kind: "text", text: "Point final. La dictée est terminée." });
    } else {
      parts.push({ kind: "phonemes", phonemes: PUNCTUATION_PHONEMES[word], text: word });
    }
    parts.push({ kind: "silence", seconds: after });
    last = index + word.length;
  }
  const tail = guarded.slice(last).replace(/^[,\s]+/u, "").replace(/[.\s]+$/u, "").trim();
  if (tail) parts.push({ kind: "text", text: tail });
  return parts;
}

export { planToText } from "@/lib/ai/provider";
