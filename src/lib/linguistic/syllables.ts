/**
 * Heuristic French syllabification for reading support (roadmap 8.8). Good
 * enough for alternating syllable colours; not a phonological authority.
 * Rules: split before a consonant that precedes a vowel (CV), keep
 * inseparable clusters (bl, cr, ch, gn, ph, qu, …) together, and treat a
 * final mute -e as part of the last syllable.
 */
const VOWELS = "aeiouyàâäéèêëîïôöùûüœ";
const INSEPARABLE = new Set(["bl", "cl", "fl", "gl", "pl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "vr", "ch", "ph", "th", "gn", "qu", "gu"]);

const isVowel = (char: string) => VOWELS.includes(char.toLocaleLowerCase("fr"));

export function syllabify(word: string): string[] {
  const chars = [...word];
  if (chars.length <= 3) return [word];
  const out: string[] = [];
  let current = "";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    current += char;
    if (!isVowel(char)) continue;
    // Look ahead: vowel group continues → keep going.
    let j = i + 1;
    while (j < chars.length && isVowel(chars[j])) { current += chars[j]; i = j; j++; }
    const consonants: string[] = [];
    while (j < chars.length && !isVowel(chars[j])) { consonants.push(chars[j]); j++; }
    if (j >= chars.length) { current += consonants.join(""); out.push(current); current = ""; i = chars.length; break; }
    if (consonants.length === 0) { out.push(current); current = ""; continue; }
    if (consonants.length === 1) { out.push(current); current = ""; continue; }
    const pair = consonants.slice(-2).join("").toLocaleLowerCase("fr");
    const keep = INSEPARABLE.has(pair) ? consonants.length - 2 : consonants.length - 1;
    current += consonants.slice(0, keep).join("");
    out.push(current); current = "";
    i += keep;
  }
  if (current) out.push(current);
  // A bare trailing "e"/"es" (no onset consonant) joins the previous syllable.
  if (out.length > 1 && /^e[sx]?$/iu.test(out[out.length - 1])) {
    const last = out.pop()!; out[out.length - 1] += last;
  }
  return out.filter(Boolean);
}
