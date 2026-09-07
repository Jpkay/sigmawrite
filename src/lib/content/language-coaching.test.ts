import { expect, it } from "vitest";
import { shouldOfferLanguageTip } from "./language-coaching";
it("offers no more than one automatic tip every four correct exercises", () => {
  expect(Array.from({ length: 12 }, (_, i) => i + 1).filter(shouldOfferLanguageTip)).toEqual([4, 8, 12]);
  expect(shouldOfferLanguageTip(0)).toBe(false);
});
