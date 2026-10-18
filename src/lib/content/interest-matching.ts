import {
  INTEREST_BY_KEY,
  INTEREST_GROUP_BY_KEY,
  interestGroupOf,
  interestPhrase,
} from "./interests";

/**
 * Roadmap E.1/E.5: how close a piece of content is to what the student likes.
 * `exact` = same interest, `group` = same parent group (manga ↔ anime),
 * `near` = a neighbouring group (manga & BD ↔ films & histoires).
 */
export type InterestMatchKind = "exact" | "group" | "near";

export type InterestMatch = {
  kind: InterestMatchKind;
  /** The student's interest this content serves. */
  studentInterest: string;
  /** The interest the content is actually tagged with. */
  contentInterest: string;
};

const KIND_ORDER: Record<InterestMatchKind, number> = { exact: 0, group: 1, near: 2 };

/** Weight used by pickers that blend interest with other signals (1, ½, ¼). */
export const INTEREST_MATCH_WEIGHT: Record<InterestMatchKind, number> = { exact: 1, group: 0.5, near: 0.25 };

function kindFor(contentInterest: string, studentInterest: string): InterestMatchKind | null {
  if (contentInterest === studentInterest) return "exact";
  const contentGroup = interestGroupOf(contentInterest);
  const studentGroup = interestGroupOf(studentInterest);
  if (!contentGroup || !studentGroup) return null;
  if (contentGroup === studentGroup) return "group";
  const near: readonly string[] = INTEREST_GROUP_BY_KEY[studentGroup]?.near ?? [];
  return near.includes(contentGroup) ? "near" : null;
}

/**
 * Best match between one content tag and the student's interests (ordered by
 * preference). Exact beats group beats near; on equal kind the student's
 * earlier interest wins.
 */
export function matchInterest(
  contentInterest: string | null | undefined,
  studentInterests: readonly string[],
): InterestMatch | null {
  if (!contentInterest) return null;
  let best: InterestMatch | null = null;
  for (const studentInterest of studentInterests) {
    const kind = kindFor(contentInterest, studentInterest);
    if (kind && (!best || KIND_ORDER[kind] < KIND_ORDER[best.kind])) {
      best = { kind, studentInterest, contentInterest };
      if (kind === "exact") break;
    }
  }
  return best;
}

/** Best match across several tags on one item (practice items carry a list). */
export function matchInterestTags(
  contentInterests: readonly string[],
  studentInterests: readonly string[],
): InterestMatch | null {
  let best: InterestMatch | null = null;
  for (const tag of contentInterests) {
    const match = matchInterest(tag, studentInterests);
    if (match && (!best || KIND_ORDER[match.kind] < KIND_ORDER[best.kind]
      || (KIND_ORDER[match.kind] === KIND_ORDER[best.kind]
        && studentInterests.indexOf(match.studentInterest) < studentInterests.indexOf(best.studentInterest)))) {
      best = match;
    }
  }
  return best;
}

/** 0…1 affinity for pickers: 1 exact, ½ same group, ¼ neighbour group, 0 none. */
export function interestAffinity(contentInterests: readonly string[], studentInterests: readonly string[]): number {
  const match = matchInterestTags(contentInterests, studentInterests);
  return match ? INTEREST_MATCH_WEIGHT[match.kind] : 0;
}

/** Sort key (lower = closer). Unmatched content sorts after every match. */
export const NO_INTEREST_MATCH_RANK = 999;
export function interestRank(contentInterest: string | null | undefined, studentInterests: readonly string[]): number {
  const match = matchInterest(contentInterest, studentInterests);
  if (!match) return NO_INTEREST_MATCH_RANK;
  return KIND_ORDER[match.kind] * 100 + Math.max(0, studentInterests.indexOf(match.studentInterest));
}

/**
 * E.5 picker: closest content to the student's interests. When nothing is
 * close, the first item is still returned (the student must get a text), but
 * `match` is null and `preparing` names the interests we are still writing
 * for, so the UI can say so instead of silently serving `library[0]`.
 */
export function pickClosestByInterest<T extends { primaryInterest: string | null }>(
  items: readonly T[],
  studentInterests: readonly string[],
): { item: T | null; match: InterestMatch | null; preparing: string[] } {
  const preparing = interestsWithoutContent(studentInterests, items.map((item) => item.primaryInterest));
  let best: { item: T; rank: number } | null = null;
  for (const item of items) {
    const rank = interestRank(item.primaryInterest, studentInterests);
    if (!best || rank < best.rank) best = { item, rank };
  }
  if (!best) return { item: null, match: null, preparing };
  return {
    item: best.item,
    match: matchInterest(best.item.primaryInterest, studentInterests),
    preparing,
  };
}

/** Student interests for which no item carries the exact tag. */
export function interestsWithoutContent(
  studentInterests: readonly string[],
  contentInterests: ReadonlyArray<string | null | undefined>,
): string[] {
  const available = new Set(contentInterests.filter((key): key is string => !!key));
  return studentInterests.filter((key, index) => !available.has(key) && studentInterests.indexOf(key) === index);
}

/** "Parce que tu aimes le foot" (exact) or "Tu aimes le basket ? Voici du foot." (closest group). */
export function interestPickReasonFr(match: InterestMatch | null): string | null {
  if (!match || !INTEREST_BY_KEY[match.studentInterest]) return null;
  const liked = interestPhrase(match.studentInterest);
  if (match.kind === "exact") return `Parce que tu aimes ${liked}`;
  return `Tu aimes ${liked} ? Voici un texte sur ${interestPhrase(match.contentInterest)}.`;
}

/** Emoji of the student's interest, for a small visual cue next to the reason. */
export function interestEmoji(key: string | null | undefined): string | null {
  return key ? INTEREST_BY_KEY[key]?.emoji ?? null : null;
}

function joinFr(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} et ${parts.at(-1)}`;
}

/** "On prépare des textes sur les mangas et les animés." Never more than two named. */
export function interestPreparingFr(interests: readonly string[]): string | null {
  const known = interests.filter((key) => INTEREST_BY_KEY[key]);
  if (!known.length) return null;
  const named = known.slice(0, 2).map(interestPhrase);
  const list = known.length > 2 ? `${named.join(", ")} et d’autres sujets que tu aimes` : joinFr(named);
  return `On prépare des textes sur ${list}.`;
}
