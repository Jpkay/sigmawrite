import { describe, expect, it } from "vitest";
import { classifyDictation, classifySegment, scoreOutOfTen, tokenize, type ErrorCategory } from "./classify";

/** Golden learner errors (roadmap 1.3): expected segment, what the student wrote, category, node. */
const GOLDEN: [string, string, ErrorCategory, string][] = [
  ["Il a mangé.", "Il à mangé.", "logogrammique", "distinguer_homophones_a_a"],
  ["Elle est partie.", "Elle et partie.", "logogrammique", "distinguer_homophones_et_est"],
  ["Ils sont là.", "Ils son là.", "logogrammique", "distinguer_homophones_son_sont"],
  ["Ils ont faim.", "Ils on faim.", "logogrammique", "distinguer_homophones_on_ont"],
  ["Il se lave.", "Il ce lave.", "logogrammique", "distinguer_homophones_ce_se"],
  ["Ses amis rient.", "Ces amis rient.", "logogrammique", "distinguer_homophones_ces_ses"],
  ["Où vas-tu ?", "Ou vas-tu ?", "logogrammique", "distinguer_homophones_ou_ou"],
  ["Il est là.", "Il est la.", "logogrammique", "maintenir_orthographe_grammaticale_phrase"],
  ["Mes amis dorment.", "Mais amis dorment.", "logogrammique", "maintenir_orthographe_grammaticale_phrase"],
  ["Il peut venir.", "Il peu venir.", "logogrammique", "maintenir_orthographe_grammaticale_phrase"],
  ["Leurs parents arrivent.", "Leur parents arrivent.", "logogrammique", "accorder_determinant_nom_ecrit"],
  ["Tous les jours.", "Tout les jours.", "logogrammique", "accorder_determinant_nom_ecrit"],
  ["Les enfants jouent.", "Les enfants joue.", "morphogrammique_grammaticale", "accorder_sujet_verbe_ecrit"],
  ["Elles chantaient fort.", "Elles chantait fort.", "morphogrammique_grammaticale", "accorder_sujet_verbe_ecrit"],
  ["Nous partons demain.", "Nous parton demain.", "morphogrammique_grammaticale", "accorder_sujet_verbe_ecrit"],
  ["Il veut manger.", "Il veut mangé.", "morphogrammique_grammaticale", "distinguer_infinitif_participe_ecrit"],
  ["Elle a fini.", "Elle a finir.", "morphogrammique_grammaticale", "distinguer_infinitif_participe_ecrit"],
  ["Elle est partie.", "Elle est parti.", "morphogrammique_grammaticale", "accorder_participe_etre"],
  ["Ils sont venus.", "Ils sont venu.", "morphogrammique_grammaticale", "accorder_participe_etre"],
  ["Les chevaux courent.", "Les chevals courent.", "morphogrammique_grammaticale", "former_pluriel_noms_al_aux"],
  ["Des maisons blanches.", "Des maison blanches.", "morphogrammique_grammaticale", "accorder_determinant_nom_ecrit"],
  ["Une porte ouverte.", "Une porte ouvert.", "morphogrammique_grammaticale", "accorder_adjectif_nom_ecrit"],
  ["Un grand jardin.", "Un gran jardin.", "morphogrammique_lexicale", "justifier_lettre_finale_muette"],
  ["Le tabac.", "Le taba.", "morphogrammique_lexicale", "justifier_lettre_finale_muette"],
  ["Mon père.", "Mon pere.", "phonogrammique", "choisir_e_accent_aigu_grave"],
  ["La forêt.", "La foret.", "phonogrammique", "employer_accent_circonflexe"],
  ["Le garçon.", "Le garcon.", "phonogrammique", "employer_cedille"],
  ["Du maïs.", "Du mais.", "phonogrammique", "employer_trema"],
  ["Il faut manger.", "Il faut manjer.", "phonogrammique", "orthographier_g_ge_gu"],
  ["Un bateau.", "Un bato.", "phonogrammique", "orthographier_o_au_eau"],
  ["Le poisson.", "Le poison.", "phonogrammique", "orthographier_consonne_doublee"],
  ["Une jambe.", "Une janbe.", "phonogrammique", "appliquer_m_devant_m_b_p"],
  ["Quatre.", "Katre.", "phonogrammique", "orthographier_k_c_qu"],
  ["Un enfant.", "Un anfant.", "phonogrammique", "orthographier_nasale_an_en"],
  ["Une ombre.", "Une onbre.", "phonogrammique", "appliquer_m_devant_m_b_p"],
  ["La main.", "La min.", "phonogrammique", "orthographier_nasale_in_ain_ein"],
  ["Il pleut.", "il pleut.", "ideogrammique", "maintenir_orthographe_grammaticale_phrase"],
  ["L’école.", "L école.", "ideogrammique", "maintenir_orthographe_grammaticale_phrase"],
  ["Il parle vite.", "Il vite.", "extragraphique", "maintenir_orthographe_lexicale_phrase"],
  ["Il parle vite.", "Il parle très vite.", "extragraphique", "maintenir_orthographe_lexicale_phrase"],
];

describe("classifySegment golden set", () => {
  it.each(GOLDEN)("%s → %s is %s (%s)", (expected, actual, category, nodeKey) => {
    const result = classifySegment(expected, actual, 0);
    expect(result.errors.length, `errors for ${actual}: ${JSON.stringify(result.errors)}`).toBeGreaterThanOrEqual(1);
    const hit = result.errors.find((error) => error.category === category && error.nodeKey === nodeKey) ?? result.errors[0];
    expect(hit.category).toBe(category);
    expect(hit.nodeKey).toBe(nodeKey);
    expect(hit.explanationFr.length).toBeGreaterThan(20);
  });
  it("reports no error for an exact transcription", () => {
    expect(classifySegment("Les enfants jouent dans la cour.", "Les enfants jouent dans la cour.", 0).errors).toHaveLength(0);
  });
  it("tolerates straight versus curly apostrophes", () => {
    expect(classifySegment("L’école est fermée.", "L'école est fermée.", 0).errors).toHaveLength(0);
  });
});

describe("scoring", () => {
  it("weights grammatical errors twice lexical ones out of ten", () => {
    const { errors, score, profile } = classifyDictation(["Les enfants jouent.", "Mon père."], ["Les enfants joue.", "Mon pere."]);
    expect(errors).toHaveLength(2);
    expect(profile.morphogrammique_grammaticale).toBe(1);
    expect(profile.phonogrammique).toBe(1);
    expect(score).toBe(9.25);
    expect(scoreOutOfTen([])).toBe(10);
  });
  it("tokenizes elisions as separate words", () => {
    expect(tokenize("l'école qu’il aime")).toEqual(["l’", "école", "qu’", "il", "aime"]);
  });
});
