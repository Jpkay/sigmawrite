export function rankByInterestAndVocabulary<
  T extends { id: string; primaryInterest: string | null },
>(
  items: T[],
  interestOrder: string[],
  targets: Map<string, string[]>,
  mastered: Set<string>,
  plannedReuseCount: Map<string, number> = new Map(),
): T[] {
  const interestRank = new Map(interestOrder.map((key, index) => [key, index]));
  return [...items].sort((a, b) => score(a) - score(b));

  function score(item: T) {
    const interest = interestRank.get(item.primaryInterest ?? "") ?? 999;
    const words = targets.get(item.id) ?? [];
    const unknownShare = words.length
      ? words.filter((id) => !mastered.has(id)).length / words.length
      : 0;
    // Reuse is only supplied after topic matching and confirmation that the
    // authored text actually contains the due word. It therefore breaks ties
    // naturally without pushing niche vocabulary into unrelated material.
    const reuseBonus = Math.min(3, plannedReuseCount.get(item.id) ?? 0) * 20;
    return interest * 100 + unknownShare * 10 - reuseBonus;
  }
}
