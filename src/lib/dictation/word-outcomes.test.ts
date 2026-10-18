import { expect, it } from "vitest";
import { classifyDictation } from "./classify";
import { dictationWordOutcomes } from "./word-outcomes";

it("lists every dictated word with its spelling outcome", () => {
  const segments = ["Les chevaux arrivent.", "Ils sont fatigués."];
  const outcome = classifyDictation(segments, ["Les chevals arrivent.", "ils sont fatigué."]);
  const words = dictationWordOutcomes(segments, outcome.errors);
  expect(words.map((entry) => entry.word)).toEqual(["Les", "chevaux", "arrivent", "Ils", "sont", "fatigués"]);
  expect(words.find((entry) => entry.word === "chevaux")).toMatchObject({ correct: false, spellingCorrect: false, actual: "chevals" });
  expect(words.find((entry) => entry.word === "arrivent")).toMatchObject({ correct: true, spellingCorrect: true });
  expect(words.find((entry) => entry.word === "fatigués")?.spellingCorrect).toBe(false);
  // A missing capital is not a spelling error of the word.
  expect(words.find((entry) => entry.word === "Ils")).toMatchObject({ correct: false, spellingCorrect: true });
});

it("marks omitted words and ignores extra ones", () => {
  const segments = ["Le chat dort."];
  const words = dictationWordOutcomes(segments, classifyDictation(segments, ["Le gros dort."]).errors);
  expect(words).toHaveLength(3);
  const omitted = dictationWordOutcomes(segments, classifyDictation(segments, ["Le dort."]).errors);
  expect(omitted.find((entry) => entry.word === "chat")).toMatchObject({ correct: false, actual: null });
});
