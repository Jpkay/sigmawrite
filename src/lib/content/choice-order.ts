/**
 * Shuffle presentation only, retaining IDs/indices for grading. The seed keeps
 * the order stable across rendering, answer checks, retries and corrections.
 * Correctness is deliberately not an input: every position, including first,
 * must remain possible. Do not force an option to move from its stored position.
 */
export function shuffleChoices<T>(choices: readonly T[], seed: string): T[] {
  let state = 2166136261;
  for (const character of seed) {
    state = Math.imul(state ^ character.codePointAt(0)!, 16777619) >>> 0;
  }
  // Mulberry32 avoids the low-bit patterns of an LCG with modulo selection.
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const ordered = [...choices];
  for (let index = ordered.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
  }
  return ordered;
}

/** Repeated generic reading prompts must not share the same permutation. */
export function readingChoiceSeed(prompt: string, choices: readonly string[]): string {
  return `reading:${JSON.stringify([prompt, choices])}`;
}
