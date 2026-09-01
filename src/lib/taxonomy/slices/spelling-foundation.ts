import type { TaxonomyCandidate } from "../validate";

type SpellingStrand = "orthographe_lexicale" | "orthographe_grammaticale";
type SpellingBand = "foundation" | "pattern" | "morphology" | "agreement" | "homophone" | "transfer";
type NodeType = TaxonomyCandidate["nodes"][number]["nodeType"];

const sourceKey = "sigma-original-taxonomy";

const placement: Record<SpellingBand, { native: string; fsl: string }> = {
  foundation: { native: "6", fsl: "A1" },
  pattern: { native: "6", fsl: "A2" },
  morphology: { native: "6", fsl: "A2" },
  agreement: { native: "6", fsl: "A2" },
  homophone: { native: "5", fsl: "B1" },
  transfer: { native: "5", fsl: "B1" },
};

function spellingNode(
  key: string,
  labelFr: string,
  descriptionFr: string,
  strand: SpellingStrand,
  band: SpellingBand,
  options: { independent?: boolean; nodeType?: NodeType; atomicityLevel?: number } = {},
): TaxonomyCandidate["nodes"][number] {
  const levels = placement[band];
  const evidence: TaxonomyCandidate["nodes"][number]["evidence"] = [
    {
      key: "reading-receptive",
      actionFr: `Choisir, repérer ou corriger la graphie qui démontre la compétence suivante : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality: "reading",
      expectation: "receptive",
      successCriteria: {
        minimumAccuracy: 0.8,
        minimumDistinctItems: 3,
        minimumContrastingErrors: 2,
        novelWordsRequired: true,
      },
    },
    {
      key: "writing-controlled-production",
      actionFr: `Écrire sans modèle la forme attendue dans une dictée de mots, une phrase lacunaire ou une transformation : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality: "writing",
      expectation: "controlled_production",
      successCriteria: {
        minimumAccuracy: 0.8,
        minimumDistinctItems: 3,
        minimumOccasions: 2,
        unaidedResponseRequired: true,
        novelWordsRequired: true,
      },
    },
  ];
  if (options.independent) {
    evidence.push({
      key: "writing-independent-production",
      actionFr: `Maintenir puis réviser cette compétence dans deux productions nouvelles sans rappel de la règle : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality: "writing",
      expectation: "independent_production",
      successCriteria: {
        minimumAccuracy: 0.75,
        minimumDistinctTexts: 2,
        minimumOccasions: 2,
        minimumEligibleTokens: 8,
        unaidedTransferRequired: true,
      },
    });
  }
  return {
    key,
    strand,
    nodeType: options.nodeType ?? "linguistic",
    labelFr,
    descriptionFr,
    atomicityLevel: options.atomicityLevel ?? 4,
    evidence,
    sourceKeys: [sourceKey],
    mappings: [
      { learnerMode: "french_first_language", framework: "native_grade", levelMin: levels.native, levelMax: levels.native, status: "provisional", sourceKey },
      { learnerMode: "french_second_language", framework: "cefr", levelMin: levels.fsl, levelMax: levels.fsl, status: "provisional", sourceKey },
    ],
  };
}

export const SPELLING_FOUNDATION_NODES: TaxonomyCandidate["nodes"] = [
  spellingNode("segmenter_syllabes_ecrites", "Segmenter un mot en syllabes écrites", "Découper un mot régulier en unités écrites utiles au choix et au contrôle des graphies.", "orthographe_lexicale", "foundation"),
  spellingNode("associer_phoneme_graphie_frequente", "Associer un phonème à une graphie fréquente", "Relier un son entendu ou représenté à une graphie française fréquente dans un mot nouveau.", "orthographe_lexicale", "foundation"),
  spellingNode("orthographier_o_au_eau", "Choisir les graphies o/au/eau", "Sélectionner o, au ou eau dans des mots fréquents et des familles lexicales transparentes.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_k_c_qu", "Choisir les graphies k/c/qu", "Sélectionner k, c ou qu pour noter le phonème /k/ selon le mot et le contexte graphique.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_g_ge_gu", "Choisir les graphies g/ge/gu", "Employer g, ge ou gu pour conserver la valeur sonore attendue devant la voyelle suivante.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_s_ss_c", "Choisir les graphies s/ss/c", "Employer s, ss ou c pour noter le phonème /s/ dans des contextes graphiques fréquents.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_nasale_an_en", "Choisir les graphies an/en", "Sélectionner an ou en dans des mots fréquents en mobilisant la forme lexicale et sa famille.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_nasale_on_om", "Choisir les graphies on/om", "Sélectionner on ou om et appliquer la variation devant m, b ou p dans des mots fréquents.", "orthographe_lexicale", "pattern"),
  spellingNode("orthographier_nasale_in_ain_ein", "Choisir les graphies in/ain/ein", "Sélectionner in, ain ou ein pour des mots fréquents sans confondre des formes seulement homophones.", "orthographe_lexicale", "pattern"),
  spellingNode("appliquer_m_devant_m_b_p", "Employer m devant m, b ou p", "Remplacer n par m dans les graphies nasales concernées, en tenant compte des exceptions lexicales.", "orthographe_lexicale", "pattern"),
  spellingNode("choisir_e_accent_aigu_grave", "Choisir é ou è", "Distinguer l'accent aigu de l'accent grave sur e à partir de la forme et de la prononciation du mot.", "orthographe_lexicale", "pattern"),
  spellingNode("employer_accent_circonflexe", "Employer l'accent circonflexe", "Restituer l'accent circonflexe dans un ensemble délimité de mots fréquents et de formes apparentées.", "orthographe_lexicale", "pattern"),
  spellingNode("employer_cedille", "Employer la cédille", "Placer la cédille sous c pour conserver le phonème /s/ devant a, o ou u.", "orthographe_lexicale", "pattern"),
  spellingNode("employer_trema", "Employer le tréma", "Placer le tréma dans des mots fréquents lorsque deux voyelles doivent être prononcées séparément.", "orthographe_lexicale", "pattern"),
  spellingNode("reconnaitre_radical_famille_mots", "Reconnaître le radical d'une famille de mots", "Repérer la partie stable de mots apparentés afin d'appuyer un choix orthographique lexical.", "orthographe_lexicale", "morphology"),
  spellingNode("justifier_lettre_finale_muette", "Justifier une lettre finale muette", "Mobiliser une forme fléchie ou un mot de la même famille pour retrouver une consonne finale non entendue.", "orthographe_lexicale", "morphology"),
  spellingNode("orthographier_consonne_doublee", "Employer une consonne doublée", "Restituer une consonne simple ou doublée dans des mots fréquents et des dérivés transparents.", "orthographe_lexicale", "morphology"),
  spellingNode("orthographier_prefixe_frequent", "Orthographier un préfixe fréquent", "Conserver la forme d'un préfixe fréquent lors de la construction ou de l'analyse d'un mot dérivé.", "orthographe_lexicale", "morphology"),
  spellingNode("orthographier_suffixe_frequent", "Orthographier un suffixe fréquent", "Conserver la forme d'un suffixe fréquent lors de la construction ou de l'analyse d'un mot dérivé.", "orthographe_lexicale", "morphology"),
  spellingNode("orthographier_mot_invariable_frequent", "Orthographier un mot invariable fréquent", "Restituer la forme stable d'adverbes, prépositions ou connecteurs fréquents sans appui visuel.", "orthographe_lexicale", "morphology"),
  spellingNode("orthographier_mot_irregulier_frequent", "Orthographier un mot irrégulier fréquent", "Restituer la graphie mémorisée d'un mot fréquent qui ne se déduit pas entièrement des régularités courantes.", "orthographe_lexicale", "morphology"),
  spellingNode("maintenir_orthographe_lexicale_phrase", "Maintenir l'orthographe lexicale dans une phrase", "Produire une phrase nouvelle en conservant les graphies lexicales déjà travaillées sans liste de mots fournie.", "orthographe_lexicale", "transfer", { independent: true, nodeType: "procedural", atomicityLevel: 5 }),
  spellingNode("reviser_orthographe_lexicale_paragraphe", "Réviser l'orthographe lexicale d'un paragraphe", "Détecter puis corriger les erreurs lexicales d'un court paragraphe en justifiant les corrections incertaines.", "orthographe_lexicale", "transfer", { independent: true, nodeType: "metacognitive", atomicityLevel: 5 }),

  spellingNode("marquer_pluriel_nom_regulier", "Marquer le pluriel régulier d'un nom", "Ajouter la marque écrite régulière du pluriel à un nom lorsque le contexte impose le nombre pluriel.", "orthographe_grammaticale", "agreement"),
  spellingNode("former_pluriel_noms_al_aux", "Former le pluriel des noms en -al", "Choisir la forme en -aux ou l'exception en -als pour un nom fréquent présenté au pluriel.", "orthographe_grammaticale", "agreement"),
  spellingNode("former_pluriel_noms_au_eu", "Former le pluriel des noms en -au ou -eu", "Choisir la marque x ou une exception en s pour un nom fréquent terminé par -au ou -eu.", "orthographe_grammaticale", "agreement"),
  spellingNode("former_feminin_adjectif_regulier", "Former le féminin régulier d'un adjectif", "Produire la marque écrite régulière du féminin d'un adjectif dans un groupe nominal contrôlé.", "orthographe_grammaticale", "agreement"),
  spellingNode("accorder_determinant_nom_ecrit", "Réaliser l'accord déterminant-nom", "Écrire un déterminant et un nom avec des marques compatibles de genre et de nombre.", "orthographe_grammaticale", "agreement"),
  spellingNode("accorder_adjectif_nom_ecrit", "Réaliser l'accord nom-adjectif", "Écrire la forme de l'adjectif commandée par le genre et le nombre du nom donneur.", "orthographe_grammaticale", "agreement"),
  spellingNode("accorder_sujet_verbe_ecrit", "Réaliser l'accord sujet-verbe", "Écrire la terminaison verbale commandée par la personne et le nombre du sujet explicite.", "orthographe_grammaticale", "agreement"),
  spellingNode("distinguer_homophones_a_a", "Choisir « a/à »", "Distinguer la forme du verbe avoir de la préposition dans une phrase nouvelle.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_et_est", "Choisir la coordination ou la forme « est »", "Distinguer la coordination de la forme du verbe être dans une phrase nouvelle.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_son_sont", "Choisir « son/sont »", "Distinguer le déterminant possessif de la forme plurielle du verbe être.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_on_ont", "Choisir « on/ont »", "Distinguer le pronom sujet de la forme plurielle du verbe avoir.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_ce_se", "Choisir « ce/se »", "Distinguer le déterminant ou pronom démonstratif du pronom réfléchi.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_ces_ses", "Choisir « ces/ses »", "Distinguer le déterminant démonstratif du déterminant possessif à partir du sens de la phrase.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_homophones_ou_ou", "Choisir « ou/où »", "Distinguer la coordination exprimant un choix de l'adverbe ou pronom interrogatif de lieu.", "orthographe_grammaticale", "homophone"),
  spellingNode("distinguer_infinitif_participe_ecrit", "Choisir une finale en -er ou -é", "Distinguer l'infinitif du participe passé afin de produire la finale verbale attendue.", "orthographe_grammaticale", "homophone"),
  spellingNode("maintenir_orthographe_grammaticale_phrase", "Maintenir l'orthographe grammaticale dans une phrase", "Produire une phrase nouvelle en réalisant les accords et distinctions grammaticales déjà travaillés.", "orthographe_grammaticale", "transfer", { independent: true, nodeType: "procedural", atomicityLevel: 5 }),
  spellingNode("reviser_orthographe_grammaticale_paragraphe", "Réviser l'orthographe grammaticale d'un paragraphe", "Détecter puis corriger les erreurs d'accord ou d'homophonie d'un paragraphe sans signalement préalable.", "orthographe_grammaticale", "transfer", { independent: true, nodeType: "metacognitive", atomicityLevel: 5 }),
];

const edge = (
  source: string,
  target: string,
  prerequisiteClass: "hard" | "soft" = "hard",
  rationale = "La compétence source fournit une opération orthographique nécessaire à la compétence cible.",
): TaxonomyCandidate["edges"][number] => ({ source, target, type: "prerequisite", prerequisiteClass, rationale, sourceKey });

export const SPELLING_FOUNDATION_EDGES: TaxonomyCandidate["edges"] = [
  edge("segmenter_syllabes_ecrites", "associer_phoneme_graphie_frequente"),
  edge("associer_phoneme_graphie_frequente", "orthographier_o_au_eau", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_k_c_qu", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_g_ge_gu", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_s_ss_c", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_nasale_an_en", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_nasale_on_om", "soft"),
  edge("associer_phoneme_graphie_frequente", "orthographier_nasale_in_ain_ein", "soft"),
  edge("orthographier_nasale_on_om", "appliquer_m_devant_m_b_p"),
  edge("orthographier_nasale_an_en", "appliquer_m_devant_m_b_p", "soft"),
  edge("orthographier_nasale_in_ain_ein", "appliquer_m_devant_m_b_p", "soft"),
  edge("associer_phoneme_graphie_frequente", "choisir_e_accent_aigu_grave", "soft"),
  edge("associer_phoneme_graphie_frequente", "employer_cedille"),
  edge("segmenter_syllabes_ecrites", "employer_trema", "soft"),
  edge("reconnaitre_radical_famille_mots", "justifier_lettre_finale_muette"),
  edge("reconnaitre_radical_famille_mots", "orthographier_prefixe_frequent"),
  edge("reconnaitre_radical_famille_mots", "orthographier_suffixe_frequent"),
  edge("segmenter_syllabes_ecrites", "orthographier_consonne_doublee", "soft"),
  edge("orthographier_o_au_eau", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("orthographier_k_c_qu", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("choisir_e_accent_aigu_grave", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("justifier_lettre_finale_muette", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("orthographier_mot_invariable_frequent", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("orthographier_mot_irregulier_frequent", "maintenir_orthographe_lexicale_phrase", "soft"),
  edge("maintenir_orthographe_lexicale_phrase", "reviser_orthographe_lexicale_paragraphe"),

  edge("marquer_pluriel_nom_regulier", "former_pluriel_noms_al_aux"),
  edge("marquer_pluriel_nom_regulier", "former_pluriel_noms_au_eu"),
  edge("marquer_pluriel_nom_regulier", "accorder_determinant_nom_ecrit"),
  edge("former_feminin_adjectif_regulier", "accorder_adjectif_nom_ecrit"),
  edge("accorder_determinant_nom_ecrit", "accorder_adjectif_nom_ecrit", "soft"),
  edge("accorder_determinant_nom_ecrit", "maintenir_orthographe_grammaticale_phrase"),
  edge("accorder_adjectif_nom_ecrit", "maintenir_orthographe_grammaticale_phrase"),
  edge("accorder_sujet_verbe_ecrit", "maintenir_orthographe_grammaticale_phrase"),
  edge("distinguer_homophones_a_a", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_et_est", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_son_sont", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_on_ont", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_ce_se", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_ces_ses", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_homophones_ou_ou", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("distinguer_infinitif_participe_ecrit", "maintenir_orthographe_grammaticale_phrase"),
  edge("maintenir_orthographe_grammaticale_phrase", "reviser_orthographe_grammaticale_paragraphe"),
];

export const SPELLING_CROSS_SLICE_EDGES: TaxonomyCandidate["edges"] = [
  edge("construction_accord_determinant_nom", "accorder_determinant_nom_ecrit"),
  edge("construction_accord_nom_adjectif", "accorder_adjectif_nom_ecrit"),
  edge("construction_accord_sujet_verbe", "accorder_sujet_verbe_ecrit"),
  edge("reconnaitre_present_indicatif", "distinguer_homophones_a_a", "soft"),
  edge("reconnaitre_present_indicatif", "distinguer_homophones_et_est", "soft"),
  edge("reconnaitre_present_indicatif", "distinguer_homophones_son_sont", "soft"),
  edge("reconnaitre_present_indicatif", "distinguer_homophones_on_ont", "soft"),
  edge("distinguer_infinitif_participe", "distinguer_infinitif_participe_ecrit"),
  edge("accorder_participe_etre", "maintenir_orthographe_grammaticale_phrase", "soft"),
  edge("accorder_participe_avoir_cod", "maintenir_orthographe_grammaticale_phrase", "soft"),
];

export const SPELLING_ASSESSMENT_TEMPLATES = [
  { key: "orthographic-contrast", expectation: "receptive", responseType: "mcq", requiresNovelWords: true },
  { key: "word-dictation", expectation: "controlled_production", responseType: "dictee", requiresNovelWords: true },
  { key: "contextual-cloze", expectation: "controlled_production", responseType: "cloze", requiresNovelWords: true },
  { key: "error-correction", expectation: "controlled_production", responseType: "transform", requiresNovelWords: true },
  { key: "connected-writing-transfer", expectation: "independent_production", responseType: "written", requiresNovelWords: true },
] as const;

export const SPELLING_FOUNDATION_CANDIDATE: TaxonomyCandidate = {
  release: { key: "spelling-foundation-v1", version: "0.1.0", ontologyVersion: "1.0.0" },
  sources: [{ key: sourceKey, version: "1.0.0", rightsStatus: "importable", checksum: "sha256:original-authoring-source" }],
  nodes: SPELLING_FOUNDATION_NODES,
  edges: SPELLING_FOUNDATION_EDGES,
};
