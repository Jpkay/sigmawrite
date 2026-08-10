import { CONTENT_CONCEPTS } from "@/lib/content/concepts";
import type { BaselineLexiconArtifact } from "@/lib/lexicon/baseline";
import { FRENCH_TAXONOMY_V2_CANDIDATE } from "./french-v2";
import {
  checksum,
  validateInstructionalProgression,
  validateTaxonomy,
  type TaxonomyCandidate,
} from "./validate";

const sourceKey = "sigma-original-taxonomy";
type Node = TaxonomyCandidate["nodes"][number];
type Edge = TaxonomyCandidate["edges"][number];

const baseNode = (key: string) => {
  const node = FRENCH_TAXONOMY_V2_CANDIDATE.nodes.find((candidate) => candidate.key === key);
  if (!node) throw new Error(`Missing v2 node ${key}`);
  return node;
};

function masteryEvidence(labelFr: string, expectation: "receptive" | "controlled_production" | "independent_production") {
  return {
    key: expectation === "receptive" ? "reading-receptive" : expectation === "controlled_production" ? "writing-controlled-production" : "writing-independent-production",
    actionFr: expectation === "receptive"
      ? `Identifier et expliquer correctement dans des phrases nouvelles : ${labelFr.toLocaleLowerCase("fr")}.`
      : expectation === "controlled_production"
        ? `Compléter ou transformer des phrases nouvelles pour démontrer : ${labelFr.toLocaleLowerCase("fr")}.`
        : `Employer correctement dans deux productions nouvelles sans rappel immédiat : ${labelFr.toLocaleLowerCase("fr")}.`,
    modality: expectation === "receptive" ? "reading" as const : "writing" as const,
    expectation,
    successCriteria: expectation === "independent_production"
      ? { minimumAccuracy: 0.8, minimumDistinctTexts: 2, minimumOccasions: 2, unaidedTransferRequired: true }
      : { minimumAccuracy: 0.8, minimumDistinctItems: 3, minimumOccasions: 2, unaidedResponseRequired: expectation !== "receptive" },
  };
}

function derivedNode(input: {
  key: string;
  labelFr: string;
  descriptionFr: string;
  from: string;
  expectation: "receptive" | "controlled_production" | "independent_production";
  cefr?: string;
  native?: string;
  atomicityLevel?: number;
}): Node {
  const base = baseNode(input.from);
  return {
    ...base,
    key: input.key,
    labelFr: input.labelFr,
    descriptionFr: input.descriptionFr,
    atomicityLevel: input.atomicityLevel ?? 4,
    evidence: [masteryEvidence(input.labelFr, input.expectation)],
    mappings: base.mappings.map((mapping) => ({
      ...mapping,
      levelMin: mapping.framework === "cefr" ? input.cefr ?? mapping.levelMin : input.native ?? mapping.levelMin,
      levelMax: mapping.framework === "cefr" ? input.cefr ?? mapping.levelMax : input.native ?? mapping.levelMax,
    })),
  };
}

const PRONOUN_NODES: Node[] = [
  derivedNode({ key: "identifier_complement_direct", labelFr: "Identifier un complément direct", descriptionFr: "Reconnaître un complément construit sans préposition afin de pouvoir le reprendre par le, la, l’ ou les.", from: "construction_pronom_objet", expectation: "receptive", cefr: "A1" }),
  derivedNode({ key: "produire_pronom_cod", labelFr: "Employer le, la, l’ ou les", descriptionFr: "Remplacer un complément direct par le pronom correspondant à son genre et à son nombre.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "A1" }),
  derivedNode({ key: "produire_pronom_coi_personne", labelFr: "Employer lui ou leur", descriptionFr: "Remplacer un complément introduit par à et désignant une personne par lui ou leur, indépendamment du genre.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "A1" }),
  derivedNode({ key: "distinguer_pronom_cod_coi", labelFr: "Choisir entre COD et COI", descriptionFr: "Choisir le, la ou les, ou bien lui ou leur, à partir de la construction exacte du verbe.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "A2" }),
  derivedNode({ key: "produire_pronoms_y_en", labelFr: "Employer y et en", descriptionFr: "Reprendre un lieu, à plus une chose, de plus une chose ou une quantité avec y ou en.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "A2" }),
  derivedNode({ key: "placer_pronom_complement", labelFr: "Placer un pronom complément", descriptionFr: "Placer correctement un pronom complément devant un verbe simple ou l’auxiliaire d’un temps composé.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "A2" }),
  derivedNode({ key: "accorder_participe_cod_antepose", labelFr: "Accorder avec un COD antéposé", descriptionFr: "Réaliser l’accord du participe passé avec avoir lorsque le complément direct repris est placé avant.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "B1", native: "8", atomicityLevel: 5 }),
  derivedNode({ key: "ordonner_doubles_pronoms", labelFr: "Ordonner deux pronoms compléments", descriptionFr: "Ordonner deux pronoms avant le verbe et adapter leur place à l’impératif affirmatif ou négatif.", from: "construction_pronom_objet", expectation: "controlled_production", cefr: "B1", native: "8", atomicityLevel: 5 }),
  derivedNode({ key: "employer_pronoms_complements_en_contexte", labelFr: "Employer les pronoms compléments en contexte", descriptionFr: "Employer de manière autonome les pronoms compléments appropriés dans un court texte cohérent.", from: "construction_pronom_objet", expectation: "independent_production", cefr: "B1", native: "8", atomicityLevel: 5 }),
];

const TENSE_CONTEXT_NODES: Node[] = [
  ["present_indicatif", "présent de l’indicatif", "interpreter_usages_present", "A1", "6"],
  ["futur_proche", "futur proche", "interpreter_futur_proche", "A1", "6"],
  ["passe_recent", "passé récent", "interpreter_passe_recent", "A1", "6"],
  ["passe_compose", "passé composé", "interpreter_passe_compose", "A2", "6"],
  ["imparfait", "imparfait", "interpreter_imparfait", "A2", "6"],
  ["futur_simple", "futur simple", "interpreter_futur_simple", "A2", "7"],
  ["plus_que_parfait", "plus-que-parfait", "interpreter_anteriorite_passee", "B1", "8"],
  ["conditionnel_present", "conditionnel présent", "interpreter_conditionnel_present", "B1", "8"],
  ["subjonctif_present", "subjonctif présent", "interpreter_declencheur_subjonctif", "B1", "8"],
  ["imperatif", "impératif", "interpreter_valeur_imperatif", "A2", "7"],
].map(([key, label, from, cefr, native]) => derivedNode({
  key: `employer_${key}_en_contexte`,
  labelFr: `Employer le ${label} en contexte`,
  descriptionFr: `Employer le ${label} de manière autonome dans un court texte cohérent et adapté au sens visé.`,
  from,
  expectation: "independent_production",
  cefr,
  native,
  atomicityLevel: 5,
}));

const SIMPLE_PAST_NODES: Node[] = [
  derivedNode({ key: "produire_passe_simple", labelFr: "Produire le passé simple", descriptionFr: "Former les personnes et verbes fréquents du passé simple dans une phrase contrôlée.", from: "reconnaitre_passe_simple", expectation: "controlled_production", cefr: "B1", native: "8" }),
  derivedNode({ key: "employer_passe_simple_en_contexte", labelFr: "Employer le passé simple en contexte", descriptionFr: "Employer le passé simple de manière autonome pour faire avancer les événements d’un court récit écrit.", from: "interpreter_passe_simple", expectation: "independent_production", cefr: "B2", native: "9", atomicityLevel: 5 }),
];

const edge = (source: string, target: string, prerequisiteClass: "hard" | "soft" = "hard", rationale = "La compétence source est nécessaire avant l’introduction ou la maîtrise durable de la compétence cible."): Edge => ({ source, target, type: "prerequisite", prerequisiteClass, rationale, sourceKey });

const V3_EDGES: Edge[] = [
  // Pronouns: one graph node per teachable step.
  edge("construction_phrase_canonique", "identifier_complement_direct"),
  edge("identifier_complement_direct", "produire_pronom_cod"),
  edge("construction_pronom_sujet", "produire_pronom_coi_personne", "soft"),
  edge("produire_pronom_cod", "distinguer_pronom_cod_coi"),
  edge("produire_pronom_coi_personne", "distinguer_pronom_cod_coi"),
  edge("distinguer_pronom_cod_coi", "produire_pronoms_y_en"),
  edge("distinguer_pronom_cod_coi", "placer_pronom_complement"),
  edge("produire_passe_compose", "placer_pronom_complement"),
  edge("placer_pronom_complement", "accorder_participe_cod_antepose"),
  edge("accorder_participe_avoir_cod", "accorder_participe_cod_antepose"),
  edge("produire_pronoms_y_en", "ordonner_doubles_pronoms"),
  edge("placer_pronom_complement", "ordonner_doubles_pronoms"),
  edge("ordonner_doubles_pronoms", "employer_pronoms_complements_en_contexte"),
  edge("employer_pronoms_complements_en_contexte", "construction_chaine_reference"),

  // Complete recognize → controlled production → contextual meaning → independent use chains.
  edge("reconnaitre_present_indicatif", "produire_present_indicatif"),
  edge("produire_present_indicatif", "interpreter_usages_present"),
  edge("interpreter_usages_present", "employer_present_indicatif_en_contexte"),
  edge("reconnaitre_futur_proche", "produire_futur_proche"),
  edge("produire_futur_proche", "interpreter_futur_proche"),
  edge("interpreter_futur_proche", "employer_futur_proche_en_contexte"),
  edge("reconnaitre_passe_recent", "produire_passe_recent"),
  edge("produire_passe_recent", "interpreter_passe_recent"),
  edge("interpreter_passe_recent", "employer_passe_recent_en_contexte"),
  edge("reconnaitre_passe_compose", "produire_passe_compose"),
  edge("produire_passe_compose", "interpreter_passe_compose"),
  edge("interpreter_passe_compose", "employer_passe_compose_en_contexte"),
  edge("reconnaitre_imparfait", "produire_imparfait"),
  edge("produire_imparfait", "interpreter_imparfait"),
  edge("interpreter_imparfait", "employer_imparfait_en_contexte"),
  edge("reconnaitre_passe_simple", "produire_passe_simple"),
  edge("produire_passe_simple", "interpreter_passe_simple"),
  edge("interpreter_passe_simple", "employer_passe_simple_en_contexte"),
  edge("reconnaitre_futur_simple", "produire_futur_simple"),
  edge("produire_futur_simple", "interpreter_futur_simple"),
  edge("interpreter_futur_simple", "employer_futur_simple_en_contexte"),
  edge("reconnaitre_plus_que_parfait", "produire_plus_que_parfait"),
  edge("produire_plus_que_parfait", "interpreter_anteriorite_passee"),
  edge("interpreter_anteriorite_passee", "employer_plus_que_parfait_en_contexte"),
  edge("reconnaitre_conditionnel_present", "produire_conditionnel_present"),
  edge("produire_conditionnel_present", "interpreter_conditionnel_present"),
  edge("interpreter_conditionnel_present", "employer_conditionnel_present_en_contexte"),
  edge("reconnaitre_subjonctif_present", "produire_subjonctif_present_frequent"),
  edge("produire_subjonctif_present_frequent", "interpreter_declencheur_subjonctif"),
  edge("interpreter_declencheur_subjonctif", "employer_subjonctif_present_en_contexte"),
  edge("reconnaitre_imperatif", "produire_imperatif"),
  edge("produire_imperatif", "interpreter_valeur_imperatif"),
  edge("interpreter_valeur_imperatif", "employer_imperatif_en_contexte"),

  // Previously isolated or under-linked grammar, reading and spelling competencies.
  edge("construction_phrase_canonique", "construction_voix_passive"),
  edge("reconnaitre_auxiliaire", "construction_voix_passive"),
  edge("construction_phrase_canonique", "construction_nominalisation"),
  edge("construction_phrase_canonique", "construction_pronom_sujet"),
  edge("construction_subordonnee_relative", "construction_pronom_relatif"),
  edge("construction_pronom_sujet", "construction_reprise_demonstrative"),
  edge("construction_phrase_canonique", "construction_chaine_lexicale"),
  edge("construction_phrase_canonique", "construction_accord_determinant_nom"),
  edge("construction_phrase_canonique", "construction_negation_simple"),
  edge("localiser_information_explicite", "relation_cause", "soft"),
  edge("localiser_information_explicite", "relation_contraste", "soft"),
  edge("ordonner_evenements_explicites", "relation_chronologie", "soft"),
  edge("localiser_information_explicite", "relation_addition"),
  edge("relation_addition", "relation_exemple_reformulation"),
  edge("construction_phrase_canonique", "construction_discours_direct"),
  edge("construction_reprise_demonstrative", "resoudre_demonstratif"),
  edge("reconnaitre_radical_famille_mots", "deduire_mot_morphologie"),
  edge("reconnaitre_structure_cause_consequence", "reconnaitre_structure_probleme_solution"),
  edge("choisir_e_accent_aigu_grave", "employer_accent_circonflexe", "soft"),
  edge("produire_passe_compose", "accorder_participe_etre"),
  edge("produire_passe_compose", "accorder_participe_avoir_cod"),
  edge("identifier_complement_direct", "accorder_participe_avoir_cod"),
  edge("localiser_information_explicite", "distinguer_fait_opinion"),
  edge("identifier_idee_paragraphe", "identifier_point_de_vue"),
  edge("construction_phrase_canonique", "distinguer_homophones_ce_se", "soft"),
  edge("construction_phrase_canonique", "distinguer_homophones_ces_ses", "soft"),
  edge("construction_phrase_canonique", "distinguer_homophones_ou_ou", "soft"),
  edge("interpreter_passe_compose", "reconnaitre_passe_simple"),
  edge("construction_subordonnee_completive", "reconnaitre_subjonctif_present"),
  edge("relation_cause", "relation_consequence"),
];

function uniqueEdges(edges: Edge[]) {
  const seen = new Set<string>();
  return edges.filter((candidate) => {
    const key = `${candidate.source}:${candidate.target}:${candidate.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const FRENCH_TAXONOMY_V3_CANDIDATE: TaxonomyCandidate = {
  ...FRENCH_TAXONOMY_V2_CANDIDATE,
  release: { key: "french-taxonomy-v3", version: "3.0.0", ontologyVersion: "1.0.0" },
  nodes: [...FRENCH_TAXONOMY_V2_CANDIDATE.nodes.filter((candidate) => candidate.key !== "construction_pronom_objet"), ...PRONOUN_NODES, ...TENSE_CONTEXT_NODES, ...SIMPLE_PAST_NODES],
  edges: uniqueEdges([
    ...FRENCH_TAXONOMY_V2_CANDIDATE.edges.filter((candidate) =>
      candidate.source !== "construction_pronom_objet"
      && candidate.target !== "construction_pronom_objet"
      && !(
        candidate.type === "prerequisite"
        && candidate.source === "interpreter_declencheur_subjonctif"
        && candidate.target === "produire_subjonctif_present_frequent"
      )
    ),
    ...V3_EDGES,
  ]),
};

export const FRENCH_TAXONOMY_V3_PRODUCTIVE_ROOTS = new Set([
  "construction_phrase_canonique",
  "former_participe_passe",
  "marquer_pluriel_nom_regulier",
  "former_feminin_adjectif_regulier",
  "segmenter_syllabes_ecrites",
  "reconnaitre_radical_famille_mots",
  "orthographier_mot_invariable_frequent",
  "orthographier_mot_irregulier_frequent",
]);

export type FrenchTaxonomyV3Artifact = ReturnType<typeof buildFrenchTaxonomyV3>;

export function buildFrenchTaxonomyV3(input: { ontologyText: string; sourceRegisterText: string; lexical: BaselineLexiconArtifact }) {
  const baseValidation = validateTaxonomy(FRENCH_TAXONOMY_V3_CANDIDATE);
  const progressionIssues = validateInstructionalProgression(FRENCH_TAXONOMY_V3_CANDIDATE, { productiveRootKeys: FRENCH_TAXONOMY_V3_PRODUCTIVE_ROOTS });
  const validation = {
    ...baseValidation,
    valid: baseValidation.valid && progressionIssues.length === 0,
    issues: [...baseValidation.issues, ...progressionIssues],
  };
  if (!validation.valid) throw new Error(`French Taxonomy v3 is invalid: ${validation.issues.map((issue) => `${issue.code}:${issue.recordKeys.join(",")}`).join(";")}`);
  const coverage = {
    nodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.length,
    edges: FRENCH_TAXONOMY_V3_CANDIDATE.edges.length,
    evidenceDefinitions: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.reduce((sum, node) => sum + node.evidence.length, 0),
    progressionMappings: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.reduce((sum, node) => sum + node.mappings.length, 0),
    conjugationNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand === "conjugaison").length,
    readingNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand === "comprehension_ecrite").length,
    constructionNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand === "grammaire_syntaxe").length,
    spellingNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand.startsWith("orthographe_")).length,
    lexicalSpellingNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand === "orthographe_lexicale").length,
    grammaticalSpellingNodes: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand === "orthographe_grammaticale").length,
    spellingEvidenceDefinitions: FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter((node) => node.strand.startsWith("orthographe_")).reduce((sum, node) => sum + node.evidence.length, 0),
    contentConcepts: CONTENT_CONCEPTS.length,
    lexicalLemmas: input.lexical.report.lemmaCount,
    lexicalForms: input.lexical.report.formCount,
    lexicalHeldOutCoverage: input.lexical.report.heldOutCoverage,
  };
  const gaps = [{ key: "oral_modalities", severity: "planned", note: "La version v3 privilégie encore la lecture et l’écriture; les preuves orales restent à étendre." }] as const;
  const componentChecksums = {
    ontology: checksum(input.ontologyText), sources: checksum(input.sourceRegisterText), taxonomy: validation.manifest.checksums.content,
    lexical: input.lexical.manifest.contentChecksum, concepts: checksum(CONTENT_CONCEPTS), gaps: checksum(gaps), coverage: checksum(coverage),
  };
  const content = {
    schemaVersion: 1 as const,
    release: FRENCH_TAXONOMY_V3_CANDIDATE.release,
    ontology: { version: "1.0.0" as const, document: "docs/french-ontology-v1.md" as const, checksum: componentChecksums.ontology },
    sources: { register: "docs/french-source-register.md" as const, checksum: componentChecksums.sources, keys: FRENCH_TAXONOMY_V3_CANDIDATE.sources.map((source) => source.key) },
    taxonomy: FRENCH_TAXONOMY_V3_CANDIDATE,
    lexicalRelease: { key: input.lexical.release.key, version: input.lexical.release.version, checksum: input.lexical.manifest.contentChecksum, report: input.lexical.report },
    contentConcepts: CONTENT_CONCEPTS,
    gaps,
    validation,
    coverage,
  };
  return { ...content, manifest: { componentChecksums, contentChecksum: checksum(content) } };
}
