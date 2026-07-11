import type { TaxonomyCandidate } from "../validate";

type ReadingFamily =
  | "explicit" | "reference" | "vocabulary" | "main_idea" | "structure"
  | "inference" | "summary" | "viewpoint" | "argument" | "evidence";

const sourceKey = "sigma-original-taxonomy";
const placement: Record<ReadingFamily, { native: string; fsl: string }> = {
  explicit: { native: "6", fsl: "A1" },
  reference: { native: "6", fsl: "A1" },
  vocabulary: { native: "6", fsl: "A2" },
  main_idea: { native: "6", fsl: "A2" },
  structure: { native: "6", fsl: "A2" },
  inference: { native: "6", fsl: "A2" },
  summary: { native: "6", fsl: "A2" },
  viewpoint: { native: "5", fsl: "B1" },
  argument: { native: "5", fsl: "B1" },
  evidence: { native: "6", fsl: "A2" },
};

export type ReadingTextApplicability = "literary" | "informational" | "argumentative" | "all";

function readingNode(
  key: string,
  labelFr: string,
  descriptionFr: string,
  family: ReadingFamily,
  applicability: ReadingTextApplicability,
  expectation: "receptive" | "controlled_production" = "receptive",
): TaxonomyCandidate["nodes"][number] & { textApplicability: ReadingTextApplicability } {
  const levels = placement[family];
  return {
    key,
    strand: "comprehension_ecrite",
    nodeType: family === "evidence" || family === "summary" ? "procedural" : "conceptual",
    labelFr,
    descriptionFr,
    atomicityLevel: 4,
    textApplicability: applicability,
    evidence: [{
      key: `${applicability}-${expectation}`,
      actionFr: expectation === "receptive"
        ? `Sélectionner une réponse et une justification textuelle pour : ${labelFr.toLocaleLowerCase("fr")}.`
        : `Formuler une réponse brève et vérifiable pour : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality: "reading",
      expectation,
      successCriteria: {
        minimumAccuracy: 0.8,
        minimumDistinctTexts: 3,
        minimumTextTypes: applicability === "all" ? 2 : 1,
        evidenceSpanRequired: family === "evidence" || family === "inference" || family === "argument",
      },
    }],
    sourceKeys: [sourceKey],
    mappings: [
      { learnerMode: "french_first_language", framework: "native_grade", levelMin: levels.native, levelMax: levels.native, status: "provisional", sourceKey },
      { learnerMode: "french_second_language", framework: "cefr", levelMin: levels.fsl, levelMax: levels.fsl, status: "provisional", sourceKey },
    ],
  };
}

export const READING_FOUNDATION_NODES = [
  readingNode("localiser_information_explicite", "Localiser une information explicite", "Retrouver un fait directement énoncé sans exiger une inférence supplémentaire.", "explicit", "all"),
  readingNode("associer_information_question", "Associer une information à la question posée", "Sélectionner le détail explicitement énoncé qui répond précisément à une question.", "explicit", "all"),
  readingNode("ordonner_evenements_explicites", "Ordonner des événements explicitement datés", "Reconstruire l'ordre d'événements à partir d'indices temporels directement fournis.", "explicit", "all"),

  readingNode("resoudre_pronom_sujet", "Résoudre la référence d'un pronom sujet", "Identifier l'antécédent d'un pronom sujet dans une chaîne locale non ambiguë.", "reference", "all"),
  readingNode("resoudre_pronom_objet", "Résoudre la référence d'un pronom objet", "Identifier l'antécédent d'un pronom complément dans une chaîne locale.", "reference", "all"),
  readingNode("resoudre_demonstratif", "Résoudre une reprise démonstrative", "Relier un démonstratif à l'entité, l'événement ou la proposition qu'il reprend.", "reference", "all"),
  readingNode("suivre_chaine_lexicale", "Suivre une chaîne lexicale", "Relier répétitions, synonymes et reformulations qui maintiennent un même référent.", "reference", "all"),

  readingNode("deduire_mot_definition_locale", "Déduire un mot grâce à une définition locale", "Inférer un sens lorsque le texte fournit une définition ou une reformulation proche.", "vocabulary", "all"),
  readingNode("deduire_mot_exemple_contraste", "Déduire un mot grâce à un exemple ou un contraste", "Utiliser exemples, oppositions ou conséquences locales pour sélectionner le sens pertinent.", "vocabulary", "all"),
  readingNode("deduire_mot_morphologie", "Déduire un mot grâce à sa morphologie", "Combiner radical, préfixe ou suffixe avec le contexte pour proposer un sens plausible.", "vocabulary", "all"),
  readingNode("choisir_sens_polysemique", "Choisir le sens contextuel d'un mot polysémique", "Écarter les sens incompatibles et retenir celui qui convient au passage.", "vocabulary", "all"),

  readingNode("identifier_idee_phrase", "Identifier l'idée centrale d'une phrase complexe", "Distinguer l'information principale des précisions à l'intérieur d'une phrase.", "main_idea", "all"),
  readingNode("identifier_idee_paragraphe", "Identifier l'idée principale d'un paragraphe", "Sélectionner la formulation qui couvre les informations essentielles du paragraphe.", "main_idea", "all"),
  readingNode("identifier_idee_globale", "Identifier l'idée principale d'un texte", "Dégager l'objet et le propos dominants sans choisir un détail isolé.", "main_idea", "all"),

  readingNode("reconnaitre_structure_chronologique", "Reconnaître une structure chronologique", "Identifier une organisation fondée sur la succession temporelle.", "structure", "all"),
  readingNode("reconnaitre_structure_cause_consequence", "Reconnaître une structure de cause et conséquence", "Identifier comment le texte relie causes, mécanismes et résultats.", "structure", "informational"),
  readingNode("reconnaitre_structure_comparaison", "Reconnaître une structure comparative", "Identifier les critères selon lesquels des éléments sont rapprochés ou opposés.", "structure", "informational"),
  readingNode("reconnaitre_structure_probleme_solution", "Reconnaître une structure problème-solution", "Identifier le problème posé, les réponses proposées et leurs relations.", "structure", "informational"),
  readingNode("identifier_role_paragraphe", "Identifier le rôle d'un paragraphe", "Déterminer si un paragraphe introduit, développe, illustre, nuance ou conclut le propos.", "structure", "all"),

  readingNode("inferer_cause_locale", "Inférer une cause locale", "Déduire une cause non formulée directement à partir d'indices voisins.", "inference", "all"),
  readingNode("inferer_consequence_locale", "Inférer une conséquence locale", "Déduire un résultat probable ou implicite à partir d'indices textuels.", "inference", "all"),
  readingNode("inferer_chronologie_implicite", "Inférer une relation temporelle implicite", "Établir l'ordre de deux événements lorsque les indices sont indirects.", "inference", "all"),
  readingNode("inferer_motivation_personnage", "Inférer la motivation d'un personnage", "Relier actions, paroles et contexte pour proposer une intention soutenue par le récit.", "inference", "literary"),
  readingNode("inferer_hypothese_informationnelle", "Inférer une conclusion informationnelle", "Combiner plusieurs faits d'un texte informatif pour former une conclusion limitée.", "inference", "informational"),

  readingNode("selectionner_elements_resume", "Sélectionner les éléments essentiels d'un résumé", "Conserver idées et relations nécessaires tout en écartant exemples secondaires et répétitions.", "summary", "all"),
  readingNode("reformuler_sans_copier", "Reformuler une idée sans la copier", "Exprimer fidèlement une idée avec une formulation différente et sans ajout externe.", "summary", "all", "controlled_production"),
  readingNode("organiser_resume_informatif", "Organiser un résumé informatif", "Présenter objet, idées principales et relations logiques d'un texte informatif.", "summary", "informational", "controlled_production"),
  readingNode("organiser_resume_narratif", "Organiser un résumé narratif", "Présenter situation, événements décisifs et issue sans reproduire tous les détails.", "summary", "literary", "controlled_production"),

  readingNode("identifier_point_de_vue", "Identifier un point de vue", "Associer une affirmation ou une perception à la voix qui la porte.", "viewpoint", "all"),
  readingNode("comparer_points_de_vue", "Comparer deux points de vue", "Énoncer une ressemblance ou une différence précise entre deux positions textuelles.", "viewpoint", "all", "controlled_production"),
  readingNode("interpreter_tonalite_litteraire", "Interpréter une tonalité littéraire", "Relier des choix de mots et de narration à une attitude ou une tonalité plausible.", "viewpoint", "literary"),
  readingNode("identifier_position_auteur", "Identifier la position d'un auteur informatif", "Distinguer information présentée, choix de cadrage et prise de position explicite.", "viewpoint", "informational"),

  readingNode("distinguer_fait_opinion", "Distinguer un fait d'une opinion", "Classer une proposition selon qu'elle est vérifiable ou qu'elle exprime un jugement.", "argument", "argumentative"),
  readingNode("identifier_these_argument", "Identifier une thèse", "Repérer la position principale qu'un texte argumentatif cherche à défendre.", "argument", "argumentative"),
  readingNode("identifier_raison_argument", "Identifier une raison argumentative", "Relier une raison à la thèse précise qu'elle soutient.", "argument", "argumentative"),
  readingNode("evaluer_pertinence_preuve", "Évaluer la pertinence d'une preuve", "Décider si un exemple, fait ou témoignage soutient réellement l'affirmation visée.", "argument", "argumentative"),
  readingNode("reconnaitre_contre_argument", "Reconnaître un contre-argument", "Identifier une objection ou une position concurrente traitée par le texte.", "argument", "argumentative"),

  readingNode("localiser_span_preuve", "Localiser un passage servant de preuve", "Sélectionner la portion minimale du texte qui soutient une réponse donnée.", "evidence", "all"),
  readingNode("relier_preuve_interpretation", "Relier une preuve à une interprétation", "Expliquer brièvement comment le passage cité soutient l'interprétation proposée.", "evidence", "all", "controlled_production"),
  readingNode("distinguer_preuve_connaissance_externe", "Distinguer preuve textuelle et connaissance externe", "Écarter une réponse plausible qui n'est pas soutenue par le passage lorsque le texte suffit.", "evidence", "all"),
] satisfies Array<TaxonomyCandidate["nodes"][number] & { textApplicability: ReadingTextApplicability }>;

const edge = (source: string, target: string, prerequisiteClass: "hard" | "soft" = "hard", rationale = "La compétence source fournit une opération nécessaire à l'interprétation cible."): TaxonomyCandidate["edges"][number] => ({
  source, target, type: "prerequisite", prerequisiteClass, rationale, sourceKey,
});

export const READING_FOUNDATION_EDGES: TaxonomyCandidate["edges"] = [
  edge("localiser_information_explicite", "associer_information_question"),
  edge("localiser_information_explicite", "ordonner_evenements_explicites"),
  edge("resoudre_pronom_sujet", "suivre_chaine_lexicale", "soft"),
  edge("resoudre_pronom_objet", "suivre_chaine_lexicale", "soft"),
  edge("deduire_mot_definition_locale", "choisir_sens_polysemique", "soft"),
  edge("deduire_mot_exemple_contraste", "choisir_sens_polysemique", "soft"),
  edge("identifier_idee_phrase", "identifier_idee_paragraphe"),
  edge("identifier_idee_paragraphe", "identifier_idee_globale"),
  edge("identifier_idee_paragraphe", "identifier_role_paragraphe"),
  edge("reconnaitre_structure_chronologique", "inferer_chronologie_implicite", "soft"),
  edge("reconnaitre_structure_cause_consequence", "inferer_cause_locale", "soft"),
  edge("localiser_information_explicite", "inferer_cause_locale"),
  edge("localiser_information_explicite", "inferer_consequence_locale"),
  edge("suivre_chaine_lexicale", "inferer_motivation_personnage", "soft"),
  edge("localiser_information_explicite", "inferer_hypothese_informationnelle"),
  edge("identifier_idee_paragraphe", "selectionner_elements_resume"),
  edge("selectionner_elements_resume", "reformuler_sans_copier"),
  edge("identifier_idee_globale", "organiser_resume_informatif"),
  edge("reconnaitre_structure_cause_consequence", "organiser_resume_informatif", "soft"),
  edge("reconnaitre_structure_chronologique", "organiser_resume_narratif"),
  edge("selectionner_elements_resume", "organiser_resume_narratif"),
  edge("identifier_point_de_vue", "comparer_points_de_vue"),
  edge("identifier_point_de_vue", "interpreter_tonalite_litteraire"),
  edge("identifier_point_de_vue", "identifier_position_auteur"),
  edge("distinguer_fait_opinion", "identifier_these_argument", "soft"),
  edge("identifier_these_argument", "identifier_raison_argument"),
  edge("identifier_raison_argument", "evaluer_pertinence_preuve"),
  edge("identifier_these_argument", "reconnaitre_contre_argument"),
  edge("associer_information_question", "localiser_span_preuve"),
  edge("localiser_span_preuve", "relier_preuve_interpretation"),
  edge("distinguer_preuve_connaissance_externe", "relier_preuve_interpretation"),
  edge("localiser_span_preuve", "evaluer_pertinence_preuve"),
  edge("inferer_cause_locale", "relier_preuve_interpretation", "soft"),
  edge("inferer_motivation_personnage", "relier_preuve_interpretation", "soft"),
];

export const READING_QUESTION_TYPE_COMPETENCIES = {
  explicit_information: ["associer_information_question"],
  reference: ["resoudre_pronom_sujet", "resoudre_pronom_objet", "resoudre_demonstratif", "suivre_chaine_lexicale"],
  vocabulary_in_context: ["deduire_mot_definition_locale", "deduire_mot_exemple_contraste", "deduire_mot_morphologie", "choisir_sens_polysemique"],
  main_idea: ["identifier_idee_paragraphe", "identifier_idee_globale"],
  text_structure: ["reconnaitre_structure_chronologique", "reconnaitre_structure_cause_consequence", "reconnaitre_structure_comparaison", "reconnaitre_structure_probleme_solution", "identifier_role_paragraphe"],
  inference: ["inferer_cause_locale", "inferer_consequence_locale", "inferer_chronologie_implicite", "inferer_motivation_personnage", "inferer_hypothese_informationnelle"],
  summary: ["selectionner_elements_resume", "reformuler_sans_copier", "organiser_resume_informatif", "organiser_resume_narratif"],
  viewpoint: ["identifier_point_de_vue", "comparer_points_de_vue", "interpreter_tonalite_litteraire", "identifier_position_auteur"],
  argument: ["distinguer_fait_opinion", "identifier_these_argument", "identifier_raison_argument", "evaluer_pertinence_preuve", "reconnaitre_contre_argument"],
  textual_evidence: ["localiser_span_preuve", "relier_preuve_interpretation", "distinguer_preuve_connaissance_externe"],
} as const;

export const READING_ASSESSMENT_TEMPLATES = [
  { key: "explicit-span", responseType: "evidence_choice", requiresEvidenceSpan: true, textApplicability: "all" },
  { key: "local-inference", responseType: "mcq_with_evidence", requiresEvidenceSpan: true, textApplicability: "all" },
  { key: "informational-structure", responseType: "structure_map", requiresEvidenceSpan: true, textApplicability: "informational" },
  { key: "literary-motivation", responseType: "short_answer", requiresEvidenceSpan: true, textApplicability: "literary" },
  { key: "argument-evidence", responseType: "claim_evidence_match", requiresEvidenceSpan: true, textApplicability: "argumentative" },
  { key: "summary-transfer", responseType: "written", requiresEvidenceSpan: false, textApplicability: "all" },
] as const;

export const READING_FOUNDATION_CANDIDATE: TaxonomyCandidate = {
  release: { key: "reading-comprehension-foundation-v1", version: "0.1.0", ontologyVersion: "1.0.0" },
  sources: [{ key: sourceKey, version: "1.0.0", rightsStatus: "importable", checksum: "sha256:original-authoring-source" }],
  nodes: READING_FOUNDATION_NODES,
  edges: READING_FOUNDATION_EDGES,
};

