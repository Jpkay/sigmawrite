/**
 * Deterministic French typography (applied after the line editor, before the
 * gates). Fixes what models get wrong: straight quotes, apostrophes, spaces
 * before high punctuation, dialogue dashes, ellipses. Never changes words.
 */
const NNBSP = " "; // espace fine insécable
const NBSP = " ";

export function normalizeFrenchTypography(text: string): string {
  let out = text.normalize("NFC").replace(/\r\n?/gu, "\n");
  out = out.replace(/\.{3}/gu, "…");
  out = out.replace(/(\p{L})'(\p{L})/gu, "$1’$2");
  // Straight double quotes → guillemets (alternate open/close).
  let open = true;
  out = out.replace(/"/gu, () => { const q = open ? "«" : "»"; open = !open; return q; });
  out = out.replace(/“/gu, "«").replace(/”/gu, "»");
  out = out.replace(/«\s*/gu, `«${NBSP}`).replace(/\s*»/gu, `${NBSP}»`);
  out = out.replace(/[   ]*([;!?])/gu, `${NNBSP}$1`);
  // Colons get a non-breaking space, except inside agreement markers {{m:…|f:…}}.
  out = out.replace(/(\S)[   ]*:(?!\/\/)/gu, (match: string, ch: string, offset: number, whole: string) => {
    const before = whole.slice(Math.max(0, offset - 2), offset + 1);
    return /\{\{m$|\|f$/u.test(before) ? match : `${ch}${NBSP}:`;
  });
  // Dialogue lines start with a cadratin followed by a non-breaking space.
  out = out.replace(/^[ \t]*[-–—][ \t]*/gmu, `—${NBSP}`);
  out = out.replace(/[ \t]{2,}/gu, " ").replace(/[ \t]+$/gmu, "").replace(/\n{3,}/gu, "\n\n");
  return out.trim();
}

/** Plain text for comparisons (models and stylometry see regular spaces). */
export function plainSpaces(text: string): string {
  return text.replace(/[  ]/gu, " ");
}
