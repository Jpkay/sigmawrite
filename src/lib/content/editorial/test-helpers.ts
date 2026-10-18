import type { EditorialLLM, LlmCall, LlmResult } from "./llm";
import type { EditorialRole } from "./types";

/** Scripted LLM for tests: each role returns the next queued output (or the last one). */
export class ScriptedLLM implements EditorialLLM {
  readonly calls: LlmCall[] = [];
  constructor(private readonly script: Partial<Record<EditorialRole, unknown[]>>, private readonly costPerCall = 0.01) {}
  modelFor(role: EditorialRole) { return `mock/${role}`; }
  async complete(call: LlmCall): Promise<LlmResult> {
    this.calls.push(call);
    const queue = this.script[call.role];
    if (!queue || queue.length === 0) throw new Error(`no scripted output for ${call.role}`);
    const value = queue.length > 1 ? queue.shift() : queue[0];
    if (value instanceof Error) throw value;
    return { text: typeof value === "string" ? value : JSON.stringify(value), model: `mock/${call.role}`, usage: { inputTokens: 100, outputTokens: 100, costUsd: this.costPerCall }, latencyMs: 1 };
  }
}

export const GOOD_RUBRIC = { voice: 5, concreteness: 5, rhythm: 4.5, dialogue: 4.5, showDontTell: 4.5, surprise: 4.5, noMoralizing: 5, vocabulary: 4.5, language: 5 };
export const WEAK_RUBRIC = { voice: 3, concreteness: 3, rhythm: 3, dialogue: 3, showDontTell: 3, surprise: 3, noMoralizing: 4, vocabulary: 3, language: 4 };
