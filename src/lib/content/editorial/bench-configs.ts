import type { LineEditMode } from "./live";

/**
 * Live chapter configurations compared by scripts/editorial-live-bench.mts.
 * `env` overrides the role → model / reasoning map of llm.ts; results are in
 * the README ("Cost and latency of live chapters").
 */
export type BenchConfig = { label: string; env: Record<string, string>; lineEdit: LineEditMode };

const OPUS = "anthropic/claude-opus-5.5";
const SONNET = "anthropic/claude-sonnet-5.5";
const HAIKU = "anthropic/claude-haiku-5.5";
const fastReviewers = { EDITORIAL_MODEL_REVIEWER: HAIKU, EDITORIAL_REASONING_REVIEWER: "off" };

export const BENCH_CONFIGS: Record<string, BenchConfig> = {
  baseline: { label: "Opus author + Opus line editor, Gemini Flash reviewers (editorial-1.0.0)", env: { EDITORIAL_MODEL_AUTHOR: OPUS, EDITORIAL_MODEL_LINE_EDITOR: OPUS, EDITORIAL_MODEL_REVIEWER: "google/gemini-3.8-flash", EDITORIAL_REASONING_WRITER: "default", EDITORIAL_REASONING_REVIEWER: "default" }, lineEdit: "always" },
  "sonnet-opus": { label: "Sonnet author + Opus line editor, Gemini Flash reviewers", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_MODEL_LINE_EDITOR: OPUS, EDITORIAL_MODEL_REVIEWER: "google/gemini-3.8-flash", EDITORIAL_REASONING_WRITER: "default", EDITORIAL_REASONING_REVIEWER: "default" }, lineEdit: "always" },
  "sonnet-opus-haiku": { label: "Sonnet author + Opus line editor, Haiku reviewers (no thinking)", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_MODEL_LINE_EDITOR: OPUS, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "always" },
  "sonnet-opus-cond-haiku": { label: "Sonnet author + Opus line editor only when the pre-check finds something, Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_MODEL_LINE_EDITOR: OPUS, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "conditional" },
  "sonnet-sonnet-haiku": { label: "Sonnet author + Sonnet line editor, Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_MODEL_LINE_EDITOR: SONNET, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "always" },
  "sonnet-low-sonnet-haiku": { label: "Sonnet author + Sonnet line editor (low effort), Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_MODEL_LINE_EDITOR: SONNET, EDITORIAL_REASONING_WRITER: "low", ...fastReviewers }, lineEdit: "always" },
  "sonnet-only-haiku": { label: "Sonnet author, no line editor, Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: SONNET, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "never" },
  "opus-only-haiku": { label: "Opus author, no line editor, Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: OPUS, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "never" },
  "haiku-sonnet-haiku": { label: "Haiku author + Sonnet line editor, Haiku reviewers", env: { EDITORIAL_MODEL_AUTHOR: HAIKU, EDITORIAL_MODEL_LINE_EDITOR: SONNET, EDITORIAL_REASONING_WRITER: "default", ...fastReviewers }, lineEdit: "always" },
};
