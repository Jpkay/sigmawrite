import { CostMeter, type EditorialLLM } from "./llm";
import type { EditorialBrief } from "./brief";
import { architectPrompt, sagaOutlineSchema, type SagaOutline } from "./prompts";
import type { StyleCard } from "./styles";
import { callRole, type RunLogger } from "./team";
import { TENSES_BY_BAND, type GradeBand, type TenseKey } from "./types";

/**
 * Saga outline and running summary (roadmap H.13). The architect writes the
 * plot stages, cast, 2–3 endings and the tense plan once; every chapter
 * receives the outline plus the story so far, so live chapters stay coherent.
 */

export function chapterCountFor(band: GradeBand): number {
  return band === "cm" ? 7 : band === "6e-5e" ? 8 : 9;
}

export async function architectSaga(brief: EditorialBrief, style: StyleCard, llm: EditorialLLM, logger: RunLogger, costCapUsd = 0.4): Promise<SagaOutline> {
  const chapterCount = chapterCountFor(brief.gradeBand);
  const meter = new CostMeter(costCapUsd);
  const { value } = await callRole({ llm, logger, meter, gates: {} }, "architect", architectPrompt(brief, style, chapterCount), sagaOutlineSchema, 0.9, 6000);
  return sanitizeOutline(value, brief.gradeBand, chapterCount);
}

/** Keeps the outline inside the band's curriculum and the chapter count. */
export function sanitizeOutline(outline: SagaOutline, band: GradeBand, chapterCount: number): SagaOutline {
  const allowed = TENSES_BY_BAND[band];
  const stages = outline.stages.filter((s) => s.chapter >= 1 && s.chapter <= chapterCount).sort((a, b) => a.chapter - b.chapter);
  const tensePlan = outline.tensePlan
    .map((p) => ({ chapter: p.chapter, tenses: p.tenses.filter((t) => allowed.includes(t as TenseKey)) }))
    .filter((p) => p.tenses.length > 0 && p.chapter <= chapterCount);
  return { ...outline, stages, tensePlan };
}

/** Target tenses of a chapter: the outline's plan, else the brief's tenses. */
export function tensesForChapter(outline: SagaOutline | null, chapter: number, fallback: TenseKey[]): TenseKey[] {
  const planned = outline?.tensePlan.find((p) => p.chapter === chapter)?.tenses as TenseKey[] | undefined;
  return planned?.length ? planned.slice(0, 2) : fallback;
}

/** Running summary: chapter summaries in order, trimmed to the most recent ~350 words. */
export function appendToSummary(summary: string, chapterIndex: number, chapterSummary: string, choiceLabel: string | null): string {
  const line = `Ch. ${chapterIndex} : ${chapterSummary.trim()}${choiceLabel ? ` Choix : « ${choiceLabel} ».` : ""}`;
  const lines = [...summary.split("\n").filter(Boolean), line];
  while (lines.join(" ").split(/\s+/u).length > 350 && lines.length > 2) lines.splice(1, 1);
  return lines.join("\n");
}

export function allowedCastNames(outline: SagaOutline | null): string[] {
  return (outline?.cast ?? []).flatMap((c) => c.name.split(/\s+/u)).filter((n) => n.length >= 2);
}
