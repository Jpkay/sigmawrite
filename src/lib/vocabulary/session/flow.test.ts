import { describe, expect, it } from "vitest";
import { applyResult, initFlow, missedWordItem, nextStep, type FlowState } from "./flow";
import type { WordItem, WordItemCore } from "./types";

const typed = (id: string, senseId: string, format: "hear_and_type" | "type_from_definition" = "type_from_definition"): WordItemCore =>
  format === "hear_and_type"
    ? { id, token: `t:${id}`, senseId, interest: null, format, audioUrl: "a.mp3", length: 5, firstLetter: "a" }
    : { id, token: `t:${id}`, senseId, interest: null, format, definition: "déf", length: 5, firstLetter: "a" };
const rebuild = (id: string, senseId: string): WordItemCore => ({ id, token: `t:${id}`, senseId, interest: null, format: "rebuild_letters", letters: ["b", "a"], definition: null });
const explain = (id: string, senseId: string): WordItemCore => ({ id, token: `t:${id}`, senseId, interest: null, format: "explain_own_words", word: "mot", sentence: null });

const item = (n: number): WordItem => ({
  ...typed(`p${n}`, `s${n}`, "hear_and_type"),
  retry: typed(`r${n}`, `s${n}`),
  rescue: rebuild(`x${n}`, `s${n}`),
  harder: explain(`h${n}`, `s${n}`),
});

function play(state: FlowState, answers: (step: NonNullable<ReturnType<typeof nextStep>>) => boolean, limit = 40) {
  const log: Array<{ id: string; stage: string; correct: boolean; assist: boolean }> = [];
  for (let i = 0; i < limit; i++) {
    const step = nextStep(state);
    if (!step) break;
    const correct = answers(step);
    log.push({ id: step.item.id, stage: step.stage, correct, assist: step.assist });
    state = applyResult(state, step, correct);
  }
  return log;
}

describe("word burst flow (C.4 relearning, rules 1 and 3)", () => {
  it("plays planned items in order when everything is right", () => {
    const log = play(initFlow([item(1), item(2), item(3)]), () => true);
    expect(log.map((entry) => entry.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("brings a missed word back 2–4 items later in another format until it is right once", () => {
    const items = [1, 2, 3, 4, 5, 6].map(item);
    const log = play(initFlow(items), (step) => step.item.id !== "p1");
    const back = log.findIndex((entry) => entry.id === "r1");
    expect(back).toBeGreaterThanOrEqual(2);
    expect(back).toBeLessThanOrEqual(4);
    expect(log.filter((entry) => entry.id.endsWith("1")).map((entry) => entry.id)).toEqual(["p1", "r1"]);
  });

  it("uses the recognition rescue after a second miss and ends on a success", () => {
    const log = play(initFlow([item(1), item(2)]), (step) => step.item.format === "rebuild_letters");
    expect(log.some((entry) => entry.id === "x1")).toBe(true);
    expect(log.at(-1)!.correct).toBe(true);
  });

  it("never ends on a miss: the last missed word comes back once in its easiest form", () => {
    let wrongOnce = false;
    const log = play(initFlow([item(1)]), (step) => {
      if (step.item.id === "p1") return false;
      if (step.stage === "retry" && !wrongOnce) { wrongOnce = true; return false; }
      return step.item.format === "rebuild_letters";
    });
    expect(log.at(-1)).toMatchObject({ correct: true });
  });

  it("gets harder above 90 % and starts with a hint below 60 % (zone of proximal development)", () => {
    const many = Array.from({ length: 8 }, (_, index) => item(index + 1));
    const easy = play(initFlow(many), () => true);
    expect(easy.slice(0, 4).every((entry) => entry.stage === "primary")).toBe(true);
    expect(easy.slice(4).some((entry) => entry.stage === "harder")).toBe(true);
    const hard = play(initFlow(many), (step) => step.stage !== "primary" && step.stage !== "harder");
    const firstAssisted = hard.find((entry) => entry.stage === "primary" && entry.assist);
    expect(firstAssisted).toBeDefined();
  });

  it("brings missed mini-dictée words back on their own", () => {
    const retry = typed("w1:retry", "sw1");
    const missed = missedWordItem({ id: "w1", senseId: "sw1", retry })!;
    const mini: WordItem = { id: "m", token: "t:m", senseId: "sw0", interest: null, format: "mini_dictation", words: [] };
    let state = initFlow([mini, item(2), item(3), item(4)]);
    const step = nextStep(state)!;
    state = applyResult(state, step, false, [missed]);
    const log = play(state, () => true);
    expect(log.some((entry) => entry.id === "w1:retry")).toBe(true);
  });
});
