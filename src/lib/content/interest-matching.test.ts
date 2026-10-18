import { describe, expect, it } from "vitest";
import {
  interestAffinity,
  interestPickReasonFr,
  interestPreparingFr,
  interestRank,
  interestsWithoutContent,
  matchInterest,
  matchInterestTags,
  NO_INTEREST_MATCH_RANK,
  pickClosestByInterest,
} from "./interest-matching";
import { withInterestReasons } from "./interest-note";
import { SEED_TEXTS } from "./texts";

describe("interest matching (E.1/E.5)", () => {
  it("prefers exact, then same group, then neighbour group", () => {
    expect(matchInterest("manga", ["anime", "manga"])).toEqual({ kind: "exact", studentInterest: "manga", contentInterest: "manga" });
    expect(matchInterest("anime", ["manga"])?.kind).toBe("group");
    expect(matchInterest("movies_series", ["manga"])?.kind).toBe("near");
    expect(matchInterest("money", ["manga"])).toBeNull();
    expect(matchInterest(null, ["manga"])).toBeNull();
    expect(matchInterest("general", ["manga"])).toBeNull();
  });

  it("serves the student's earlier interest first on equal closeness", () => {
    expect(matchInterest("football", ["basketball", "volleyball"])?.studentInterest).toBe("basketball");
  });

  it("matches the best tag of a multi-tagged item", () => {
    expect(matchInterestTags(["environment", "animals"], ["animals"])?.kind).toBe("exact");
    expect(matchInterestTags(["technology"], ["gaming", "cars"])).toMatchObject({ kind: "group", studentInterest: "cars" });
    expect(interestAffinity(["animals"], ["animals"])).toBe(1);
    expect(interestAffinity(["anime"], ["manga"])).toBe(0.5);
    expect(interestAffinity(["books"], ["manga"])).toBe(0.25);
    expect(interestAffinity([], ["manga"])).toBe(0);
    expect(interestAffinity(["manga"], [])).toBe(0);
  });

  it("ranks closer content lower", () => {
    const interests = ["manga", "football"];
    expect(interestRank("manga", interests)).toBeLessThan(interestRank("football", interests));
    expect(interestRank("football", interests)).toBeLessThan(interestRank("anime", interests));
    expect(interestRank("anime", interests)).toBeLessThan(interestRank("books", interests));
    expect(interestRank("money", interests)).toBe(NO_INTEREST_MATCH_RANK);
  });

  it("falls back to the closest group and says what is being prepared", () => {
    const library = [
      { slug: "budget", primaryInterest: "money" },
      { slug: "foot", primaryInterest: "football" },
    ];
    const pick = pickClosestByInterest(library, ["basketball"]);
    expect(pick.item?.slug).toBe("foot");
    expect(pick.match?.kind).toBe("group");
    expect(pick.preparing).toEqual(["basketball"]);
  });

  it("never pretends a match when nothing is close", () => {
    const pick = pickClosestByInterest([{ slug: "budget", primaryInterest: "money" }], ["manga"]);
    expect(pick.item?.slug).toBe("budget");
    expect(pick.match).toBeNull();
    expect(interestPreparingFr(pick.preparing)).toBe("On prépare des textes sur les mangas.");
    expect(pickClosestByInterest([], ["manga"]).item).toBeNull();
  });

  it("lists student interests without exact content, once each", () => {
    expect(interestsWithoutContent(["manga", "football", "manga"], ["football", null])).toEqual(["manga"]);
  });
});

describe("student-facing copy", () => {
  it("explains picks warmly and briefly", () => {
    expect(interestPickReasonFr(matchInterest("football", ["football"]))).toBe("Parce que tu aimes le foot");
    expect(interestPickReasonFr(matchInterest("anime", ["manga"]))).toBe("Tu aimes les mangas ? Voici un texte sur les animés.");
    expect(interestPickReasonFr(null)).toBeNull();
  });

  it("names at most two interests being prepared", () => {
    expect(interestPreparingFr([])).toBeNull();
    expect(interestPreparingFr(["unknown"])).toBeNull();
    expect(interestPreparingFr(["manga", "anime"])).toBe("On prépare des textes sur les mangas et les animés.");
    expect(interestPreparingFr(["manga", "anime", "dance"])).toBe("On prépare des textes sur les mangas, les animés et d’autres sujets que tu aimes.");
  });

  it("attaches a reason to each recommended text", () => {
    const football = SEED_TEXTS.find((text) => text.primaryInterest === "football")!;
    const [explained] = withInterestReasons([football], ["volleyball"]);
    expect(explained.pickReasonFr).toBe("Tu aimes le volley ? Voici un texte sur le foot.");
    expect(withInterestReasons([football], ["food"])[0].pickReasonFr).toBeNull();
  });
});
