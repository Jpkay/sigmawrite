/**
 * Immediate spelling feedback (roadmap 2026-10 D.3): the expected word is
 * shown with the part the student got wrong highlighted. Deterministic
 * character alignment, never a model. Accents only → "accent" segments
 * (graded Hard per B.2, shown as "attention aux accents").
 */
import type { FeedbackSegment } from "./types";

const base = (char: string) => char.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLocaleLowerCase("fr");
const norm = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ").replace(/[’'`´]/gu, "'");

type Step = { kind: "match" | "accent" | "sub" | "del" | "ins"; expected?: string };

function align(answer: string[], expected: string[]): Step[] {
  const n = answer.length, m = expected.length;
  const cost = (a: string, e: string) => (a.toLocaleLowerCase("fr") === e.toLocaleLowerCase("fr") ? 0 : base(a) === base(e) ? 0.5 : 1);
  const dp: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost(answer[i - 1], expected[j - 1]));
    }
  }
  const steps: Step[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + cost(answer[i - 1], expected[j - 1])) {
      const c = cost(answer[i - 1], expected[j - 1]);
      steps.push({ kind: c === 0 ? "match" : c === 0.5 ? "accent" : "sub", expected: expected[j - 1] });
      i--; j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      steps.push({ kind: "del", expected: expected[j - 1] });
      j--;
    } else {
      steps.push({ kind: "ins" });
      i--;
    }
  }
  return steps.reverse();
}

/**
 * Splits `expected` into segments: "ok" letters, "accent" letters (right
 * letter, wrong or missing accent), "wrong" letters (replaced) and
 * "missing" letters (the student left them out). Extra letters the student
 * typed mark the neighbouring expected letter as wrong.
 */
export function spellingFeedback(answer: string, expected: string): FeedbackSegment[] {
  const a = [...norm(answer)];
  const e = [...norm(expected)];
  const kinds: FeedbackSegment["kind"][] = [];
  let pendingExtra = false;
  for (const step of align(a, e)) {
    if (step.kind === "ins") { pendingExtra = true; if (kinds.length) kinds[kinds.length - 1] = kinds[kinds.length - 1] === "ok" ? "wrong" : kinds[kinds.length - 1]; continue; }
    const kind: FeedbackSegment["kind"] = step.kind === "match" ? "ok" : step.kind === "accent" ? "accent" : step.kind === "sub" ? "wrong" : "missing";
    kinds.push(pendingExtra && kind === "ok" ? "wrong" : kind);
    pendingExtra = false;
  }
  const segments: FeedbackSegment[] = [];
  e.forEach((char, index) => {
    const kind = kinds[index] ?? "ok";
    const last = segments[segments.length - 1];
    if (last && last.kind === kind) last.text += char;
    else segments.push({ text: char, kind });
  });
  return segments;
}

/** True when every segment is fine. */
export const isPerfect = (segments: FeedbackSegment[]) => segments.every((segment) => segment.kind === "ok");
