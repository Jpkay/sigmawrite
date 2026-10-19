import { interestRank } from "./interest-matching";

/**
 * Interest closeness first (exact interest, then same group, then neighbour
 * group — roadmap E.1/E.5), familiarity of target words as the tie-breaker.
 */
export function rankByInterestAndVocabulary<T extends { id: string; primaryInterest: string | null }>(items: T[], interestOrder: string[], targets: Map<string, string[]>, known: Set<string>): T[] {
  return [...items].sort((a, b) => score(a) - score(b));
  function score(item: T) {
    const interest = interestRank(item.primaryInterest, interestOrder);
    const words = targets.get(item.id) ?? [];
    const unknown = words.length ? words.filter((id) => !known.has(id)).length / words.length : 0;
    return interest * 100 + unknown * 10;
  }
}
