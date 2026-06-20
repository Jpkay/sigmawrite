import { describe, expect, it } from "vitest";
import {
  auxiliaryOf,
  conjugate,
  imparfait,
  participePasse,
  passeCompose,
  present,
  UnsupportedVerbError,
} from "./conjugation";

describe("présent", () => {
  it("regular -er (parler)", () => {
    expect(present("parler", "1s")).toBe("parle");
    expect(present("parler", "3p")).toBe("parlent");
    expect(present("parler", "1p")).toBe("parlons");
  });
  it("-ger keeps e in nous (manger → mangeons)", () => {
    expect(present("manger", "1p")).toBe("mangeons");
  });
  it("-cer softens c in nous (commencer → commençons)", () => {
    expect(present("commencer", "1p")).toBe("commençons");
  });
  it("group-2 -ir (finir)", () => {
    expect(present("finir", "1s")).toBe("finis");
    expect(present("finir", "1p")).toBe("finissons");
    expect(present("finir", "3p")).toBe("finissent");
  });
  it("irregulars", () => {
    expect(present("être", "3s")).toBe("est");
    expect(present("avoir", "3p")).toBe("ont");
    expect(present("aller", "1s")).toBe("vais");
    expect(present("faire", "2p")).toBe("faites");
  });
  it("throws on unsupported verb shape", () => {
    expect(() => present("xyzzre", "1s")).toThrow(UnsupportedVerbError);
  });
});

describe("imparfait (derived from présent-nous stem)", () => {
  it("regular", () => {
    expect(imparfait("parler", "1s")).toBe("parlais");
    expect(imparfait("parler", "1p")).toBe("parlions");
  });
  it("-ger/-cer spelling falls out automatically", () => {
    expect(imparfait("manger", "3s")).toBe("mangeait");
    expect(imparfait("commencer", "3s")).toBe("commençait");
    expect(imparfait("manger", "1p")).toBe("mangions"); // no extra e before i
  });
  it("irregular stems fall out (faire→faisais, voir→voyais, prendre→prenais)", () => {
    expect(imparfait("faire", "1s")).toBe("faisais");
    expect(imparfait("voir", "3s")).toBe("voyait");
    expect(imparfait("prendre", "3p")).toBe("prenaient");
    expect(imparfait("aller", "1s")).toBe("allais");
  });
  it("être is the one exception (ét-)", () => {
    expect(imparfait("être", "1s")).toBe("étais");
    expect(imparfait("être", "3p")).toBe("étaient");
  });
});

describe("participe passé", () => {
  it("regular", () => {
    expect(participePasse("parler")).toBe("parlé");
    expect(participePasse("finir")).toBe("fini");
  });
  it("irregular", () => {
    expect(participePasse("prendre")).toBe("pris");
    expect(participePasse("être")).toBe("été");
    expect(participePasse("avoir")).toBe("eu");
    expect(participePasse("venir")).toBe("venu");
  });
});

describe("auxiliary choice", () => {
  it("être verbs vs avoir verbs", () => {
    expect(auxiliaryOf("aller")).toBe("être");
    expect(auxiliaryOf("partir")).toBe("être");
    expect(auxiliaryOf("manger")).toBe("avoir");
    expect(auxiliaryOf("finir")).toBe("avoir");
  });
});

describe("passé composé", () => {
  it("avoir aux, invariable participle", () => {
    expect(passeCompose("manger", "1s")).toBe("ai mangé");
    expect(passeCompose("finir", "3p")).toBe("ont fini");
    expect(passeCompose("prendre", "2s")).toBe("as pris");
  });
  it("être aux agrees with the subject", () => {
    expect(passeCompose("aller", "3s")).toBe("est allé");
    expect(passeCompose("aller", "3s", { gender: "f" })).toBe("est allée");
    expect(passeCompose("aller", "3p")).toBe("sont allés");
    expect(passeCompose("aller", "3p", { gender: "f" })).toBe("sont allées");
    expect(passeCompose("partir", "1p", { gender: "f" })).toBe("sommes parties");
  });
  it("avoir aux agrees only with a preceding COD (advanced rule)", () => {
    // "les fleurs que j'ai cueillies" — COD (f.pl) before avoir
    expect(
      passeCompose("cueillir", "1s", { codBefore: { gender: "f", number: "p" } })
    ).toBe("ai cueillies");
    // without a preceding COD it stays invariable
    expect(passeCompose("cueillir", "1s")).toBe("ai cueilli");
  });
});

describe("conjugate dispatcher", () => {
  it("routes by tense", () => {
    expect(conjugate("parler", "present", "2s")).toBe("parles");
    expect(conjugate("parler", "imparfait", "2s")).toBe("parlais");
    expect(conjugate("aller", "passe_compose", "3s", { gender: "f" })).toBe(
      "est allée"
    );
  });
});
