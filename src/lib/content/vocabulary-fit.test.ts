import{describe,expect,it}from"vitest";import{rankByInterestAndVocabulary}from"./vocabulary-fit";describe("reading vocabulary fit",()=>{it("keeps interest primary and familiarity as a tie-breaker",()=>{const items=[{id:"hard",primaryInterest:"space"},{id:"fit",primaryInterest:"space"},{id:"other",primaryInterest:"music"}];const targets=new Map([["hard",["a","b"]],["fit",["a"]],["other",[]]]);expect(rankByInterestAndVocabulary(items,["space","music"],targets,new Set(["a"])).map(x=>x.id)).toEqual(["fit","hard","other"]);});});

describe("reading fallback to interest groups (E.5)", () => {
  it("ranks exact interest, then same group, then unrelated", () => {
    const items = [
      { id: "money", primaryInterest: "money" },
      { id: "anime", primaryInterest: "anime" },
      { id: "manga", primaryInterest: "manga" },
    ];
    expect(rankByInterestAndVocabulary(items, ["manga"], new Map(), new Set()).map((item) => item.id)).toEqual(["manga", "anime", "money"]);
    expect(rankByInterestAndVocabulary(items.slice(0, 2), ["manga"], new Map(), new Set()).map((item) => item.id)).toEqual(["anime", "money"]);
  });
});
