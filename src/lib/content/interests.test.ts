import { describe, expect, it } from "vitest";
import { INTERESTS, INTEREST_BY_KEY, INTEREST_GROUPS, INTEREST_GROUP_BY_KEY, interestGroupOf, interestPhrase, interestsInGroup } from "./interests";

describe("interest catalogue and groups (E.1)", () => {
  it("keeps all 38 selectable interest keys for stored choices", () => {
    expect(INTERESTS).toHaveLength(38);
    expect(new Set(INTERESTS.map((interest) => interest.key)).size).toBe(38);
    for (const key of ["manga", "anime", "comics", "board_games", "beauty", "african_history"]) expect(INTEREST_BY_KEY[key]).toBeDefined();
  });

  it("gives every interest a known parent group and every group members", () => {
    for (const interest of INTERESTS) expect(INTEREST_GROUP_BY_KEY[interest.group]).toBeDefined();
    for (const group of INTEREST_GROUPS) expect(interestsInGroup(group.key).length).toBeGreaterThan(0);
  });

  it("merges the expected families", () => {
    expect(interestsInGroup("manga_bd")).toEqual(["manga", "anime", "comics"]);
    expect(interestGroupOf("board_games")).toBe("games");
    expect(interestGroupOf("beauty")).toBe("fashion_style");
    expect(interestGroupOf("basketball")).toBe(interestGroupOf("football"));
    expect(interestGroupOf("unknown")).toBeNull();
    expect(interestGroupOf(null)).toBeNull();
  });

  it("only points groups at existing, different neighbour groups", () => {
    for (const group of INTEREST_GROUPS) {
      for (const near of group.near) {
        expect(INTEREST_GROUP_BY_KEY[near]).toBeDefined();
        expect(near).not.toBe(group.key);
      }
    }
  });

  it("has a short French phrase with an article for every interest", () => {
    for (const interest of INTERESTS) expect(interest.phraseFr).toMatch(/^(le |la |les |l’)/);
    expect(interestPhrase("football")).toBe("le foot");
    expect(interestPhrase("manga_bd")).toBe("les mangas et la BD");
    expect(interestPhrase("some_key")).toBe("some key");
  });
});
