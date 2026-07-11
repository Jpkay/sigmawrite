import type { TaxonomyCandidate } from "../validate";

const sourceKey = "sigma-original-taxonomy";
type Family = "clause" | "reference" | "agreement" | "negation" | "relation" | "discourse";
const placement: Record<Family, { native: string; fsl: string }> = {
  clause: { native: "6", fsl: "A2" },
  reference: { native: "6", fsl: "A2" },
  agreement: { native: "6", fsl: "A1" },
  negation: { native: "6", fsl: "A1" },
  relation: { native: "6", fsl: "A2" },
  discourse: { native: "5", fsl: "B1" },
};

function node(key: string, labelFr: string, descriptionFr: string, family: Family, atomicityLevel = 4): TaxonomyCandidate["nodes"][number] {
  const levels = placement[family];
  return {
    key,
    strand: family === "agreement" ? "orthographe_grammaticale" : "grammaire_syntaxe",
    nodeType: "linguistic",
    labelFr,
    descriptionFr,
    atomicityLevel,
    evidence: [{
      key: "reading-analysis",
      actionFr: `Identifier la construction dans des phrases nouvelles et expliquer son rôle : ${labelFr.toLocaleLowerCase("fr")}.`,
      modality: "reading",
      expectation: "receptive",
      successCriteria: { minimumAccuracy: 0.8, minimumDistinctItems: 3, negativeExamplesRequired: true },
    }],
    sourceKeys: [sourceKey],
    mappings: [
      { learnerMode: "french_first_language", framework: "native_grade", levelMin: levels.native, levelMax: levels.native, status: "provisional", sourceKey },
      { learnerMode: "french_second_language", framework: "cefr", levelMin: levels.fsl, levelMax: levels.fsl, status: "provisional", sourceKey },
    ],
  };
}

export const CONSTRUCTION_FOUNDATION_NODES: TaxonomyCandidate["nodes"] = [
  node("construction_phrase_canonique", "Reconnaître une phrase canonique", "Identifier un noyau verbal et ses constituants dans un ordre courant.", "clause"),
  node("construction_coordination", "Reconnaître une coordination", "Identifier deux unités de même statut reliées par un coordonnant.", "clause"),
  node("construction_subordonnee_relative", "Reconnaître une subordonnée relative", "Identifier une proposition qui complète un antécédent au moyen d'un pronom relatif.", "clause"),
  node("construction_subordonnee_completive", "Reconnaître une subordonnée complétive", "Identifier une proposition qui complète notamment un verbe de parole, pensée ou perception.", "clause"),
  node("construction_subordonnee_circonstancielle", "Reconnaître une subordonnée circonstancielle", "Identifier une proposition qui exprime une relation de temps, cause, but, condition ou concession.", "clause"),
  node("construction_voix_passive", "Reconnaître une construction passive", "Identifier le patient comme sujet d'une forme construite avec être et un participe.", "clause"),
  node("construction_nominalisation", "Reconnaître une nominalisation", "Repérer un nom qui condense un procès, une qualité ou une relation exprimable verbalement.", "clause"),

  node("construction_pronom_sujet", "Interpréter un pronom sujet", "Relier un pronom sujet à son antécédent compatible en personne et en nombre.", "reference"),
  node("construction_pronom_objet", "Interpréter un pronom complément", "Relier un pronom objet, datif, en ou y à l'élément repris.", "reference"),
  node("construction_pronom_relatif", "Interpréter un pronom relatif", "Relier un relatif à son antécédent et à sa fonction dans la subordonnée.", "reference"),
  node("construction_reprise_demonstrative", "Interpréter une reprise démonstrative", "Relier celui, celle, cela ou une forme voisine à son référent textuel.", "reference"),
  node("construction_chaine_reference", "Suivre une chaîne de référence", "Maintenir l'identité d'un référent à travers noms, pronoms et reformulations.", "reference", 5),
  node("construction_chaine_lexicale", "Reconnaître une chaîne lexicale cohésive", "Relier répétitions, synonymes, hyperonymes et mots d'un même champ qui maintiennent le thème.", "reference"),

  node("construction_accord_determinant_nom", "Analyser l'accord déterminant-nom", "Identifier le donneur et les marques de genre ou nombre dans le groupe nominal.", "agreement"),
  node("construction_accord_nom_adjectif", "Analyser l'accord nom-adjectif", "Relier les marques de l'adjectif au nom qui commande son accord.", "agreement"),
  node("construction_accord_sujet_verbe", "Analyser l'accord sujet-verbe", "Relier la personne et le nombre du verbe à son sujet, y compris lorsque les mots sont éloignés.", "agreement"),
  node("construction_accord_participe", "Analyser l'accord d'un participe passé", "Identifier l'auxiliaire, le donneur d'accord éventuel et la marque réalisée.", "agreement", 5),

  node("construction_negation_simple", "Reconnaître une négation simple", "Identifier l'encadrement négatif courant autour du verbe conjugué.", "negation"),
  node("construction_negation_complexe", "Interpréter une négation complexe", "Distinguer les portées de ne plus, ne jamais, ne rien, ne personne ou ne guère.", "negation"),
  node("construction_portee_negation", "Déterminer la portée d'une négation", "Identifier précisément l'élément ou la proposition affectée par la négation.", "negation", 5),

  node("relation_cause", "Identifier une relation de cause", "Relier une raison ou un mécanisme au fait qu'il explique.", "relation"),
  node("relation_consequence", "Identifier une relation de conséquence", "Relier un résultat au fait ou mécanisme qui le produit.", "relation"),
  node("relation_contraste", "Identifier une relation de contraste", "Repérer l'opposition informative entre deux éléments rapprochés.", "relation"),
  node("relation_concession", "Identifier une relation de concession", "Repérer un fait qui aurait pu empêcher le résultat mais ne l'empêche pas.", "relation"),
  node("relation_chronologie", "Identifier une relation chronologique", "Relier les événements selon leur ordre, simultanéité ou durée.", "relation"),
  node("relation_addition", "Identifier une relation d'addition", "Reconnaître l'ajout d'un argument, fait ou exemple de même orientation.", "relation"),
  node("relation_exemple_reformulation", "Identifier un exemple ou une reformulation", "Distinguer une illustration d'une nouvelle idée et relier une reformulation à son contenu.", "relation"),
  node("relation_condition", "Identifier une relation de condition", "Relier une hypothèse ou condition au résultat qui en dépend.", "relation"),
  node("relation_but", "Identifier une relation de but", "Relier une action à l'objectif qu'elle cherche à atteindre.", "relation"),

  node("construction_discours_direct", "Reconnaître le discours direct", "Identifier des paroles citées avec leurs limites et leur locuteur.", "discourse"),
  node("construction_discours_indirect", "Reconnaître le discours indirect", "Identifier des paroles ou pensées intégrées syntaxiquement au récit.", "discourse"),
  node("construction_point_de_vue_narratif", "Identifier un point de vue narratif", "Repérer la position depuis laquelle les événements et perceptions sont présentés.", "discourse", 5),
  node("construction_progression_thematique", "Reconnaître une progression thématique", "Suivre la manière dont les phrases maintiennent ou déplacent le thème du passage.", "discourse", 5),
];

const edge = (source: string, target: string, prerequisiteClass: "hard" | "soft" = "hard", rationale = "La construction source fournit une opération nécessaire à la construction cible."): TaxonomyCandidate["edges"][number] => ({ source, target, type: "prerequisite", prerequisiteClass, rationale, sourceKey });

export const CONSTRUCTION_FOUNDATION_EDGES: TaxonomyCandidate["edges"] = [
  edge("construction_phrase_canonique", "construction_coordination"),
  edge("construction_phrase_canonique", "construction_subordonnee_relative"),
  edge("construction_phrase_canonique", "construction_subordonnee_completive"),
  edge("construction_phrase_canonique", "construction_subordonnee_circonstancielle"),
  edge("construction_pronom_sujet", "construction_chaine_reference"),
  edge("construction_pronom_objet", "construction_chaine_reference"),
  edge("construction_pronom_relatif", "construction_chaine_reference"),
  edge("construction_reprise_demonstrative", "construction_chaine_reference", "soft"),
  edge("construction_chaine_reference", "construction_progression_thematique"),
  edge("construction_chaine_lexicale", "construction_progression_thematique", "soft"),
  edge("construction_accord_determinant_nom", "construction_accord_nom_adjectif", "soft"),
  edge("construction_negation_simple", "construction_negation_complexe"),
  edge("construction_negation_complexe", "construction_portee_negation"),
  edge("relation_cause", "relation_concession", "soft"),
  edge("relation_contraste", "relation_concession"),
  edge("construction_subordonnee_circonstancielle", "relation_cause", "soft"),
  edge("construction_subordonnee_circonstancielle", "relation_condition", "soft"),
  edge("construction_subordonnee_circonstancielle", "relation_but", "soft"),
  edge("construction_discours_direct", "construction_discours_indirect"),
  edge("construction_chaine_reference", "construction_point_de_vue_narratif", "soft"),
];

export const CONSTRUCTION_CROSS_SLICE_EDGES: TaxonomyCandidate["edges"] = [
  edge("identifier_sujet_verbe", "construction_accord_sujet_verbe"),
  edge("reconnaitre_auxiliaire", "construction_accord_participe"),
  edge("former_participe_passe", "construction_accord_participe"),
  edge("construction_chaine_reference", "resoudre_pronom_sujet"),
  edge("construction_chaine_reference", "resoudre_pronom_objet"),
  edge("construction_chaine_lexicale", "suivre_chaine_lexicale"),
  edge("relation_cause", "inferer_cause_locale", "soft"),
  edge("relation_consequence", "inferer_consequence_locale", "soft"),
  edge("relation_chronologie", "inferer_chronologie_implicite", "soft"),
  edge("relation_contraste", "reconnaitre_structure_comparaison", "soft"),
];

export const CONSTRUCTION_FOUNDATION_CANDIDATE: TaxonomyCandidate = {
  release: { key: "construction-foundation-v1", version: "0.1.0", ontologyVersion: "1.0.0" },
  sources: [{ key: sourceKey, version: "1.0.0", rightsStatus: "importable", checksum: "sha256:original-authoring-source" }],
  nodes: CONSTRUCTION_FOUNDATION_NODES,
  edges: CONSTRUCTION_FOUNDATION_EDGES,
};

