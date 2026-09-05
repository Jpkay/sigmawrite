import { describe, expect, it } from "vitest";
import { syllabify } from "./syllables";

describe("syllabify", () => {
  it.each([
    ["maison", ["mai", "son"]],
    ["cheval", ["che", "val"]],
    ["table", ["ta", "ble"]],
    ["parapluie", ["pa", "ra", "pluie"]],
    ["ordinateur", ["or", "di", "na", "teur"]],
    ["montagne", ["mon", "ta", "gne"]],
    ["chat", ["chat"]],
  ])("%s", (word, expected) => {
    expect(syllabify(word)).toEqual(expected);
  });
});
