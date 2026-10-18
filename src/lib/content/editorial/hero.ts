import { HERO_PLACEHOLDER } from "./types";

/**
 * Hero insertion after generation (roadmap H.2). Models write
 *   {{HEROS}}                 where the hero's name goes;
 *   {{m:content|f:contente}}  where an agreement depends on the hero's gender.
 * The real name (or nickname) is inserted here, server-side, with French
 * elision (de → d', que → qu', le/la never precede a first name in our texts).
 * Gender "n" (not given) renders the masculine form; sagas for such students
 * use second-person narration, where agreements are rare.
 */

const VOWEL_START = /^[aeiouyàâäéèêëîïôöùûüœæh]/iu;
const ELIDABLE = /\b(de|que|lorsque|puisque|jusque|presque)\s+$/iu;
const AGREEMENT = /\{\{m:([^|{}]*)\|f:([^{}]*)\}\}/gu;

export type HeroIdentity = { name: string | null; gender: "f" | "m" | "n" };

/** Safe display name: letters, spaces, apostrophes and hyphens only, max 24 characters. */
export function sanitizeHeroName(name: string | null | undefined): string | null {
  const cleaned = (name ?? "").normalize("NFC").replace(/[^\p{L}' -]/gu, "").replace(/\s+/gu, " ").trim().slice(0, 24);
  return cleaned.length >= 2 ? cleaned : null;
}

export function renderHero(template: string, hero: HeroIdentity, fallbackName = "toi"): string {
  const name = sanitizeHeroName(hero.name);
  const gender = hero.gender === "n" ? "m" : hero.gender;
  let out = template.replace(AGREEMENT, (_, masculine: string, feminine: string) => (gender === "f" ? feminine : masculine));
  const pieces = out.split(HERO_PLACEHOLDER);
  if (pieces.length === 1) return out;
  out = pieces[0];
  for (let index = 1; index < pieces.length; index += 1) {
    const display = name ?? fallbackName;
    if (VOWEL_START.test(display) && ELIDABLE.test(out)) {
      out = out.replace(ELIDABLE, (match) => `${match.trim().slice(0, -1)}’`);
    }
    out += display + pieces[index];
  }
  return out;
}

/** True when a template still contains unresolved markers after rendering. */
export function hasUnresolvedMarkers(text: string): boolean {
  return /\{\{|\}\}/u.test(text);
}
