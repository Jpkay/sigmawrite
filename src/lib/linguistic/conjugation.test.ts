import { describe, expect, it } from "vitest";
import {
  auxiliaryOf,
  conditionnelPresent,
  conjugate,
  futurProche,
  futurSimple,
  imparfait,
  imperatifPresent,
  participePasse,
  passeCompose,
  passeSimple,
  plusQueParfait,
  present,
  subjonctifPresent,
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

describe("présent — modal -oir verbs", () => {
  it("top-10 modals are in the table", () => {
    expect(present("pouvoir", "1s")).toBe("peux");
    expect(present("pouvoir", "3p")).toBe("peuvent");
    expect(present("vouloir", "3s")).toBe("veut");
    expect(present("savoir", "1p")).toBe("savons");
    expect(present("devoir", "3p")).toBe("doivent");
  });
  it("unknown -oir verbs throw instead of being mangled as group 2", () => {
    expect(() => present("recevoir", "1s")).toThrow(UnsupportedVerbError);
  });
});

describe("futur simple", () => {
  it("regular -er/-ir keep the infinitive as stem", () => {
    expect(futurSimple("parler", "1s")).toBe("parlerai");
    expect(futurSimple("finir", "2p")).toBe("finirez");
    expect(futurSimple("manger", "1p")).toBe("mangerons");
  });
  it("-re drops the final e (prendre → prendrai, dire → dira)", () => {
    expect(futurSimple("prendre", "1s")).toBe("prendrai");
    expect(futurSimple("dire", "3s")).toBe("dira");
  });
  it("irregular stems", () => {
    expect(futurSimple("être", "1s")).toBe("serai");
    expect(futurSimple("avoir", "3p")).toBe("auront");
    expect(futurSimple("aller", "2s")).toBe("iras");
    expect(futurSimple("faire", "1p")).toBe("ferons");
    expect(futurSimple("venir", "3p")).toBe("viendront");
    expect(futurSimple("voir", "3s")).toBe("verra");
    expect(futurSimple("pouvoir", "3s")).toBe("pourra");
    expect(futurSimple("vouloir", "1s")).toBe("voudrai");
  });
  it("unknown -oir verbs throw", () => {
    expect(() => futurSimple("recevoir", "1s")).toThrow(UnsupportedVerbError);
  });
});

describe("conditionnel présent (futur stem + imparfait endings)", () => {
  it("regular and irregular", () => {
    expect(conditionnelPresent("parler", "1s")).toBe("parlerais");
    expect(conditionnelPresent("finir", "1p")).toBe("finirions");
    expect(conditionnelPresent("être", "3p")).toBe("seraient");
    expect(conditionnelPresent("vouloir", "1p")).toBe("voudrions");
    expect(conditionnelPresent("venir", "3s")).toBe("viendrait");
  });
});

describe("subjonctif présent", () => {
  it("regular derivation from présent-ils stem", () => {
    expect(subjonctifPresent("parler", "1s")).toBe("parle");
    expect(subjonctifPresent("finir", "3s")).toBe("finisse");
    expect(subjonctifPresent("prendre", "3s")).toBe("prenne");
    expect(subjonctifPresent("venir", "1s")).toBe("vienne");
    expect(subjonctifPresent("voir", "3s")).toBe("voie");
    expect(subjonctifPresent("devoir", "3s")).toBe("doive");
  });
  it("nous/vous coincide with imparfait", () => {
    expect(subjonctifPresent("prendre", "1p")).toBe("prenions");
    expect(subjonctifPresent("voir", "1p")).toBe("voyions");
    expect(subjonctifPresent("manger", "1p")).toBe("mangions");
    expect(subjonctifPresent("finir", "2p")).toBe("finissiez");
  });
  it("irregular paradigms", () => {
    expect(subjonctifPresent("être", "1s")).toBe("sois");
    expect(subjonctifPresent("avoir", "3s")).toBe("ait");
    expect(subjonctifPresent("aller", "3s")).toBe("aille");
    expect(subjonctifPresent("aller", "1p")).toBe("allions");
    expect(subjonctifPresent("faire", "3p")).toBe("fassent");
    expect(subjonctifPresent("pouvoir", "1s")).toBe("puisse");
    expect(subjonctifPresent("vouloir", "3p")).toBe("veuillent");
    expect(subjonctifPresent("vouloir", "1p")).toBe("voulions");
  });
});

describe("impératif présent", () => {
  it("-er verbs and aller drop the s in 2s", () => {
    expect(imperatifPresent("parler", "2s")).toBe("parle");
    expect(imperatifPresent("aller", "2s")).toBe("va");
    expect(imperatifPresent("manger", "2s")).toBe("mange");
  });
  it("other groups keep the présent form", () => {
    expect(imperatifPresent("finir", "2s")).toBe("finis");
    expect(imperatifPresent("prendre", "2s")).toBe("prends");
    expect(imperatifPresent("faire", "2p")).toBe("faites");
    expect(imperatifPresent("finir", "1p")).toBe("finissons");
  });
  it("irregulars", () => {
    expect(imperatifPresent("être", "2s")).toBe("sois");
    expect(imperatifPresent("avoir", "2s")).toBe("aie");
    expect(imperatifPresent("savoir", "2p")).toBe("sachez");
    expect(imperatifPresent("vouloir", "2p")).toBe("veuillez");
  });
  it("throws for persons without an imperative", () => {
    expect(() => imperatifPresent("parler", "3s")).toThrow(UnsupportedVerbError);
    expect(() => imperatifPresent("parler", "1s")).toThrow(UnsupportedVerbError);
  });
});

describe("plus-que-parfait", () => {
  it("avoir aux at imparfait", () => {
    expect(plusQueParfait("manger", "1s")).toBe("avais mangé");
    expect(plusQueParfait("finir", "3p")).toBe("avaient fini");
    expect(plusQueParfait("prendre", "3s")).toBe("avait pris");
  });
  it("être aux agrees with the subject", () => {
    expect(plusQueParfait("aller", "3s", { gender: "f" })).toBe("était allée");
    expect(plusQueParfait("partir", "3p")).toBe("étaient partis");
    expect(plusQueParfait("partir", "1p", { gender: "f" })).toBe("étions parties");
  });
  it("avoir aux agrees with a preceding COD", () => {
    expect(
      plusQueParfait("cueillir", "1s", { codBefore: { gender: "f", number: "p" } })
    ).toBe("avais cueillies");
  });
});

describe("futur proche", () => {
  it("aller (présent) + infinitif", () => {
    expect(futurProche("parler", "1s")).toBe("vais parler");
    expect(futurProche("finir", "1p")).toBe("allons finir");
    expect(futurProche("partir", "3p")).toBe("vont partir");
  });
});

describe("passé simple", () => {
  it("covers regular and frequent irregular paradigms", () => {
    expect(passeSimple("parler", "3p")).toBe("parlèrent");
    expect(passeSimple("finir", "1p")).toBe("finîmes");
    expect(passeSimple("être", "3p")).toBe("furent");
    expect(passeSimple("venir", "3s")).toBe("vint");
  });
});

describe("conjugate dispatcher", () => {
  it("routes by tense", () => {
    expect(conjugate("parler", "present", "2s")).toBe("parles");
    expect(conjugate("parler", "imparfait", "2s")).toBe("parlais");
    expect(conjugate("aller", "passe_compose", "3s", { gender: "f" })).toBe(
      "est allée"
    );
    expect(conjugate("parler", "futur_simple", "1s")).toBe("parlerai");
    expect(conjugate("parler", "futur_proche", "1s")).toBe("vais parler");
    expect(conjugate("parler", "passe_simple", "3s")).toBe("parla");
    expect(conjugate("vouloir", "conditionnel_present", "1p")).toBe("voudrions");
    expect(conjugate("être", "subjonctif_present", "3s")).toBe("soit");
    expect(conjugate("aller", "imperatif_present", "2s")).toBe("va");
    expect(conjugate("aller", "plus_que_parfait", "3s", { gender: "f" })).toBe(
      "était allée"
    );
  });
});
