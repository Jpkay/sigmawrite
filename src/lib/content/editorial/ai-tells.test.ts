import { describe, expect, it } from "vitest";
import calibration from "./fixtures/ai-tells-calibration.json";
import { AI_TELL_THRESHOLDS, checkAiTells } from "./ai-tells";

const codes = (text: string) => checkAiTells(text).findings.map((f) => f.code);

describe("AI-tells checker (H.9)", () => {
  it("flags planted clichés", () => {
    const text = "Au cœur de la forêt, dans un monde où la magie régnait, Léa sentit un frisson parcourir son dos. Soudain, un bruit. Soudain, un cri. Soudain, le silence. Une lueur d'espoir brillait dans ses yeux.";
    const found = codes(text);
    expect(found).toContain("phrase:« Au cœur de »");
    expect(found).toContain("phrase:« Dans un monde où »");
    expect(found).toContain("phrase:« Soudain » répété");
    expect(found).toContain("phrase:« une lueur d'espoir / de détermination »");
    expect(found).toContain("habit:overused_names");
  });

  it("flags a moral ending and named emotions", () => {
    const text = "Le match était fini. Nino rangea ses crampons dans le sac, encore pleins de terre. Il se sentait heureux et fier. Une vague de joie l'envahit. Ce jour-là, il comprit que l'amitié, c'est plus important que la victoire.";
    const found = codes(text);
    expect(found).toContain("habit:moral");
    expect(found).toContain("habit:named_emotions");
  });

  it("flags uniform sentences and symmetric dialogue", () => {
    const uniform = Array.from({ length: 10 }, (_, i) => `Le garçon marchait vers la porte numéro ${i} du stade.`).join(" ");
    expect(codes(uniform)).toContain("habit:uniform_sentences");
    const dialogue = ["— Je suis content de te voir ici.", "— Moi aussi je suis content de te voir.", "— Tu veux venir jouer avec moi.", "— Oui je veux bien jouer avec toi."].join("\n");
    expect(codes(dialogue)).toContain("habit:symmetric_dialogue");
  });

  it("leaves concrete, varied prose mostly alone", () => {
    const text = "Le ballon avait l'odeur du cuir mouillé. Nino le fit rouler sous sa semelle, deux fois, trois fois, jusqu'à ce que le gardien d'en face, un grand du collège avec un appareil dentaire, se mette à sautiller d'un pied sur l'autre comme s'il avait marché sur une guêpe.\n\nUn coup de sifflet. Personne ne bougea.\n\nAu bord du terrain, l'entraîneur mâchait son crayon. Il en était au troisième de la saison.";
    expect(checkAiTells(text).score).toBeLessThan(AI_TELL_THRESHOLDS.library);
  });

  it("scores the 20 naive AI drafts clearly worse than the 20 human samples, with few false alarms", () => {
    const ai = calibration.ai.map((x) => checkAiTells(x.text).score);
    const human = calibration.human.map((x) => checkAiTells(x.text).score);
    const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
    expect(ai).toHaveLength(20);
    expect(human).toHaveLength(20);
    expect(mean(ai)).toBeGreaterThan(2 * mean(human));
    // False alarms: human texts at or above the library bar.
    expect(human.filter((s) => s >= AI_TELL_THRESHOLDS.library).length).toBeLessThanOrEqual(1);
    // Most AI drafts are caught by the library bar.
    expect(ai.filter((s) => s >= AI_TELL_THRESHOLDS.library).length).toBeGreaterThanOrEqual(12);
  });
});
