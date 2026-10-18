import { checkLiveSentence, liveSentencePrompt, liveSentenceSchema, liveSentenceSpec, themedPrompt, LIVE_SENTENCE_VERSION, type LiveSentenceSpec } from "./live-sentence";

/**
 * F.2 live practice sentences, orchestration (no I/O here: the page passes
 * the service-role store, the model call and `after`). For the first
 * conjugation items of a practice page:
 *  1. a sentence already written for this item × interest is reused (cache);
 *  2. otherwise one is written now, within `timeoutMs`; a late sentence is
 *     still checked and cached in the background for the next session;
 *  3. anything that fails a gate or the moderation keeps the bank prompt.
 */

export type LiveSentenceRecord = { itemId: string; interest: string; sentence: string; promptFr: string; expectedForm: string; model: string | null; gates: string[] };

export type LiveSentenceDeps = {
  findCached: (itemId: string, interest: string) => Promise<string | null>;
  generate: (prompt: { system: string; user: string }) => Promise<{ text: string; model: string }>;
  moderate?: (text: string) => Promise<boolean>;
  save: (record: LiveSentenceRecord) => Promise<void>;
  schedule: (work: () => Promise<void>) => void;
  timeoutMs?: number;
  maxItems?: number;
};

type PracticeItem = { id: string; promptFr: string; validatorType: string; validatorConfig: Record<string, unknown> | null };

export function liveSentencesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.PRACTICE_LIVE_SENTENCES === "true";
}

/** Writes and checks one sentence; returns the student prompt or null. Never throws. */
export async function writeLiveSentence(spec: LiveSentenceSpec, itemId: string, bankPrompt: string, deps: Pick<LiveSentenceDeps, "generate" | "moderate" | "save">): Promise<string | null> {
  try {
    const { text, model } = await deps.generate(liveSentencePrompt(spec));
    let parsed: unknown;
    try { parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/gu, "")); } catch { return null; }
    const value = liveSentenceSchema.safeParse(parsed);
    if (!value.success) return null;
    const check = checkLiveSentence(value.data.sentence, spec);
    if (!check.ok || !check.blanked) return null;
    if (deps.moderate && !(await deps.moderate(check.sentence))) return null;
    const promptFr = themedPrompt(check.blanked, spec, bankPrompt);
    await deps.save({ itemId, interest: spec.interest, sentence: check.sentence, promptFr, expectedForm: spec.form, model, gates: ["deterministic", ...(deps.moderate ? ["moderation"] : []), LIVE_SENTENCE_VERSION] });
    return promptFr;
  } catch {
    return null;
  }
}

export async function applyLiveSentences<T extends PracticeItem>(items: T[], student: { interests: readonly string[]; grade: number }, deps: LiveSentenceDeps): Promise<T[]> {
  if (student.interests.length === 0) return items;
  const timeoutMs = deps.timeoutMs ?? 4000;
  const out = [...items];
  let used = 0;
  for (let index = 0; index < out.length && used < (deps.maxItems ?? 2); index += 1) {
    const item = out[index];
    const interest = student.interests[used % student.interests.length];
    const spec = liveSentenceSpec(item, interest, student.grade);
    if (!spec) continue;
    used += 1;
    let prompt: string | null = null;
    try { prompt = await deps.findCached(item.id, interest); } catch { prompt = null; }
    if (!prompt) {
      const work = writeLiveSentence(spec, item.id, item.promptFr, deps);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = Symbol("late");
      const raced = await Promise.race([work, new Promise<typeof late>((resolve) => { timer = setTimeout(() => resolve(late), timeoutMs); })]);
      if (timer) clearTimeout(timer);
      if (raced === late) deps.schedule(async () => { await work; });
      else prompt = raced;
    }
    if (prompt) out[index] = { ...item, promptFr: prompt };
  }
  return out;
}
