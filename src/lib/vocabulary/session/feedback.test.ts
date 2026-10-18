import { describe, expect, it } from "vitest";
import { isPerfect, spellingFeedback } from "./feedback";

describe("spelling feedback highlights the wrong part of the word (D.3)", () => {
  it("marks accents apart from wrong letters", () => {
    expect(spellingFeedback("intrepide", "intrépide")).toEqual([{ text: "intr", kind: "ok" }, { text: "é", kind: "accent" }, { text: "pide", kind: "ok" }]);
  });
  it("marks a replaced letter", () => {
    expect(spellingFeedback("intrépite", "intrépide")).toEqual([{ text: "intrépi", kind: "ok" }, { text: "d", kind: "wrong" }, { text: "e", kind: "ok" }]);
  });
  it("marks missing letters", () => {
    expect(spellingFeedback("aparaitre", "apparaître")).toEqual([{ text: "a", kind: "ok" }, { text: "p", kind: "missing" }, { text: "para", kind: "ok" }, { text: "î", kind: "accent" }, { text: "tre", kind: "ok" }]);
  });
  it("marks the letter next to an extra one", () => {
    const segments = spellingFeedback("ballonn", "ballon");
    expect(segments.some((segment) => segment.kind === "wrong")).toBe(true);
    expect(segments.map((segment) => segment.text).join("")).toBe("ballon");
  });
  it("an empty answer shows the whole word to learn", () => {
    expect(spellingFeedback("", "vaste")).toEqual([{ text: "vaste", kind: "missing" }]);
  });
  it("ignores case", () => {
    expect(isPerfect(spellingFeedback("Vaste", "vaste"))).toBe(true);
  });
});
