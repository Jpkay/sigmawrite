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

/** Segment text with punctuation spoken; a final period becomes "point". */
export function speakableSegment(text: string): string {
  let out = text.normalize("NFC").trim();
  const endsWithPeriod = /\.$/u.test(out);
  if (endsWithPeriod) out = out.slice(0, -1);
  for (const [pattern, spoken] of SPOKEN) out = out.replace(pattern, spoken);
  out = out.replace(/§(\s*§)+/gu, "§").replace(/§/gu, ",").replace(/\s{2,}/gu, " ").replace(/^,\s*/u, "").trim();
  return endsWithPeriod ? `${out}, point.` : out;
}

/** Whole-text first listening: natural reading, no announced punctuation. */
export function speakableFullText(segments: string[]): string {
  return segments.map((segment) => segment.trim()).join(" ");
}
