/**
 * Saga picker (roadmap H.1 + H.6). Pure: proposes 2–3 sagas built from the
 * student's interests, each in a different author's style, rotating styles
 * so a student meets at least 4 different styles per term.
 */
import { INTEREST_BY_KEY, INTEREST_GROUP_BY_KEY, interestGroupOf } from "@/lib/content/interests";
import { mannerOf } from "./copy";

export const STYLES_PER_TERM_GOAL = 4;

export type StyleOption = { key: string; name: string; teaser: string };
export type SagaHistoryEntry = { styleKey: string; chaptersRead: number; lastReadAt: string | null; createdAt: string };
export type SagaProposal = {
  interest: string;
  interestLabel: string;
  emoji: string;
  styleKey: string;
  styleName: string;
  manner: string;
  teaser: string;
  /** Not met yet this term (H.6 rotation). */
  newStyle: boolean;
};

/** French school trimesters, as in the recueil: September–December, January–March, April–August. */
export function schoolTermStart(now: Date): Date {
  const month = now.getUTCMonth();
  return new Date(Date.UTC(now.getUTCFullYear(), month >= 8 ? 8 : month >= 3 ? 3 : 0, 1));
}

/** Styles the student actually read (at least one chapter) since the start of the term. */
export function stylesReadThisTerm(history: SagaHistoryEntry[], now: Date): string[] {
  const since = schoolTermStart(now).getTime();
  const keys = history
    .filter((entry) => entry.chaptersRead > 0 && Date.parse(entry.lastReadAt ?? entry.createdAt) >= since)
    .map((entry) => entry.styleKey);
  return [...new Set(keys)];
}

/** Short taste of a style, from its student card: "des machines, des chiffres précis…". */
export function styleTeaser(studentCard: string): string {
  const afterColon = studentCard.includes(":") ? studentCard.slice(studentCard.indexOf(":") + 1) : studentCard;
  const first = afterColon.split(/(?<=[.!?])\s/u)[0].trim().replace(/[.;]+$/u, "");
  return first.length > 110 ? `${first.slice(0, first.lastIndexOf(" ", 105)).replace(/[,;:]$/u, "")}…` : first;
}

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 16777619) >>> 0;
  return value;
}

function interestDisplay(key: string): { label: string; emoji: string } {
  const interest = INTEREST_BY_KEY[key];
  if (interest) return { label: interest.labelFr, emoji: interest.emoji };
  const group = INTEREST_GROUP_BY_KEY[key];
  return { label: group?.labelFr ?? key.replace(/_/gu, " "), emoji: "📖" };
}

/**
 * Interests that can carry a saga. With live generation every interest can;
 * without it only interests whose fallback chapters exist (exact interest, or
 * another interest of the same group) — never a broken feature.
 */
export function storyInterests(studentInterests: string[], poolInterests: string[] | null): string[] {
  const unique = [...new Set(studentInterests.filter(Boolean))];
  if (poolInterests === null) return unique;
  const exact = new Set(poolInterests);
  const groups = new Set(poolInterests.map((key) => interestGroupOf(key) ?? key));
  return unique.filter((key) => exact.has(key) || groups.has(interestGroupOf(key) ?? key));
}

/**
 * 2–3 proposals, distinct styles (and distinct interests while there are
 * enough). Styles not read this term come first, then the least read, with
 * a daily rotation so the picker does not always show the same three.
 */
export function proposeSagas(input: {
  interests: string[];
  styles: StyleOption[];
  history: SagaHistoryEntry[];
  now: Date;
  seed: string;
  /** Style keys present in the fallback pool for an interest (live off). Preferred when present. */
  poolStyles?: Record<string, string[]>;
  count?: number;
}): SagaProposal[] {
  const count = Math.min(3, Math.max(2, input.count ?? 3));
  if (input.interests.length === 0 || input.styles.length === 0) return [];
  const readThisTerm = new Set(stylesReadThisTerm(input.history, input.now));
  const day = input.now.toISOString().slice(0, 10);
  const timesRead = (key: string) => input.history.filter((entry) => entry.styleKey === key).length;
  const rankedStyles = [...input.styles].sort((a, b) =>
    Number(readThisTerm.has(a.key)) - Number(readThisTerm.has(b.key))
    || timesRead(a.key) - timesRead(b.key)
    || hash(`${input.seed}:${day}:${a.key}`) - hash(`${input.seed}:${day}:${b.key}`));
  const rotation = hash(`${input.seed}:${day}`) % input.interests.length;
  const interests = [...input.interests.slice(rotation), ...input.interests.slice(0, rotation)];
  const used = new Set<string>();
  const proposals: SagaProposal[] = [];
  for (let slot = 0; proposals.length < count && slot < count * 2; slot += 1) {
    const interest = interests[slot % interests.length];
    const preferred = (input.poolStyles?.[interest] ?? []).filter((key) => !used.has(key));
    const style = rankedStyles.find((candidate) => preferred.includes(candidate.key)) ?? rankedStyles.find((candidate) => !used.has(candidate.key));
    if (!style) break;
    used.add(style.key);
    const display = interestDisplay(interest);
    proposals.push({
      interest, interestLabel: display.label, emoji: display.emoji,
      styleKey: style.key, styleName: style.name, manner: mannerOf(style.name), teaser: style.teaser,
      newStyle: !readThisTerm.has(style.key),
    });
  }
  return proposals;
}
