import { checksum, validateTaxonomy, type TaxonomyCandidate } from "./validate";
import { CONJUGATION_FOUNDATION_CANDIDATE } from "./slices/conjugation-foundation";
import { READING_FOUNDATION_CANDIDATE } from "./slices/reading-comprehension-foundation";
import {
  CONSTRUCTION_CROSS_SLICE_EDGES,
  CONSTRUCTION_FOUNDATION_CANDIDATE,
} from "./slices/construction-foundation";
import {
  SPELLING_CROSS_SLICE_EDGES,
  SPELLING_FOUNDATION_CANDIDATE,
} from "./slices/spelling-foundation";
import { CONTENT_CONCEPTS } from "@/lib/content/concepts";
import type { BaselineLexiconArtifact } from "@/lib/lexicon/baseline";

/**
 * V1 construction nodes deliberately remain immutable. V2 adds the productive
 * evidence needed to distinguish recognition of a grammar construction from
 * the ability to use it in a controlled sentence transformation.
 */
export const FRENCH_TAXONOMY_V2_CONSTRUCTION_NODES =
  CONSTRUCTION_FOUNDATION_CANDIDATE.nodes.map((node) => ({
    ...node,
    evidence: [
      ...node.evidence,
      {
        key: "writing-controlled-production",
        actionFr: `Compléter, corriger ou transformer une phrase nouvelle pour produire correctement : ${node.labelFr.toLocaleLowerCase("fr")}.`,
        modality: "writing" as const,
        expectation: "controlled_production" as const,
        successCriteria: {
          minimumAccuracy: 0.8,
          minimumDistinctItems: 3,
          minimumOccasions: 2,
          unaidedResponseRequired: true,
          novelSentencesRequired: true,
        },
      },
    ],
  }));

/**
 * V2 is a new immutable release. V1 remains unchanged because attempts and
 * historical estimates may already be pinned to its checksum.
 */
export const FRENCH_TAXONOMY_V2_CANDIDATE: TaxonomyCandidate = {
  release: { key: "french-taxonomy-v2", version: "2.0.0", ontologyVersion: "1.0.0" },
  sources: CONJUGATION_FOUNDATION_CANDIDATE.sources,
  nodes: [
    ...CONJUGATION_FOUNDATION_CANDIDATE.nodes,
    ...READING_FOUNDATION_CANDIDATE.nodes,
    ...FRENCH_TAXONOMY_V2_CONSTRUCTION_NODES,
    ...SPELLING_FOUNDATION_CANDIDATE.nodes,
  ],
  edges: [
    ...CONJUGATION_FOUNDATION_CANDIDATE.edges,
    ...READING_FOUNDATION_CANDIDATE.edges,
    ...CONSTRUCTION_FOUNDATION_CANDIDATE.edges,
    ...CONSTRUCTION_CROSS_SLICE_EDGES,
    ...SPELLING_FOUNDATION_CANDIDATE.edges,
    ...SPELLING_CROSS_SLICE_EDGES,
  ],
};

export const FRENCH_TAXONOMY_V2_GAPS = [
  { key: "advanced_compound_tenses", severity: "planned", note: "Futur antérieur, conditionnel passé, subjonctif passé et passé antérieur restent prévus après v2." },
  { key: "oral_modalities", severity: "planned", note: "La version v2 privilégie lecture et écriture; les preuves orales détaillées restent à étendre." },
  { key: "lexical_corpus_scale", severity: "known_limit", note: "La fréquence provient du corpus pilote SigmaWrite et ne représente pas une fréquence générale du français." },
  { key: "advanced_lexical_spelling_exceptions", severity: "planned", note: "Le socle couvre les régularités et mots fréquents; les graphies étymologiques rares, variantes et noms propres restent hors périmètre." },
  { key: "provisional_progression_boundaries", severity: "review_required", note: "Les limites de niveau restent provisoires à l’échelle du nœud et seront recalibrées avec des preuves éducatives et empiriques." },
] as const;

export type FrenchTaxonomyV2Artifact = {
  schemaVersion: 1;
  release: TaxonomyCandidate["release"];
  ontology: { version: "1.0.0"; document: "docs/french-ontology-v1.md"; checksum: string };
  sources: { register: "docs/french-source-register.md"; checksum: string; keys: string[] };
  taxonomy: TaxonomyCandidate;
  lexicalRelease: { key: string; version: string; checksum: string; report: BaselineLexiconArtifact["report"] };
  contentConcepts: typeof CONTENT_CONCEPTS;
  gaps: typeof FRENCH_TAXONOMY_V2_GAPS;
  validation: ReturnType<typeof validateTaxonomy>;
  coverage: {
    nodes: number;
    edges: number;
    evidenceDefinitions: number;
    progressionMappings: number;
    conjugationNodes: number;
    readingNodes: number;
    constructionNodes: number;
    spellingNodes: number;
    lexicalSpellingNodes: number;
    grammaticalSpellingNodes: number;
    spellingEvidenceDefinitions: number;
    contentConcepts: number;
    lexicalLemmas: number;
    lexicalForms: number;
    lexicalHeldOutCoverage: number;
  };
  manifest: { componentChecksums: Record<string, string>; contentChecksum: string };
};

export function buildFrenchTaxonomyV2(input: {
  ontologyText: string;
  sourceRegisterText: string;
  lexical: BaselineLexiconArtifact;
}): FrenchTaxonomyV2Artifact {
  const validation = validateTaxonomy(FRENCH_TAXONOMY_V2_CANDIDATE);
  if (!validation.valid) {
    throw new Error(`French Taxonomy v2 is invalid: ${validation.issues.map((issue) => issue.code).join(",")}`);
  }
  const coverage = {
    nodes: FRENCH_TAXONOMY_V2_CANDIDATE.nodes.length,
    edges: FRENCH_TAXONOMY_V2_CANDIDATE.edges.length,
    evidenceDefinitions: FRENCH_TAXONOMY_V2_CANDIDATE.nodes.reduce((sum, node) => sum + node.evidence.length, 0),
    progressionMappings: FRENCH_TAXONOMY_V2_CANDIDATE.nodes.reduce((sum, node) => sum + node.mappings.length, 0),
    conjugationNodes: CONJUGATION_FOUNDATION_CANDIDATE.nodes.length,
    readingNodes: READING_FOUNDATION_CANDIDATE.nodes.length,
    constructionNodes: CONSTRUCTION_FOUNDATION_CANDIDATE.nodes.length,
    spellingNodes: SPELLING_FOUNDATION_CANDIDATE.nodes.length,
    lexicalSpellingNodes: SPELLING_FOUNDATION_CANDIDATE.nodes.filter((node) => node.strand === "orthographe_lexicale").length,
    grammaticalSpellingNodes: SPELLING_FOUNDATION_CANDIDATE.nodes.filter((node) => node.strand === "orthographe_grammaticale").length,
    spellingEvidenceDefinitions: SPELLING_FOUNDATION_CANDIDATE.nodes.reduce((sum, node) => sum + node.evidence.length, 0),
    contentConcepts: CONTENT_CONCEPTS.length,
    lexicalLemmas: input.lexical.report.lemmaCount,
    lexicalForms: input.lexical.report.formCount,
    lexicalHeldOutCoverage: input.lexical.report.heldOutCoverage,
  };
  const componentChecksums = {
    ontology: checksum(input.ontologyText),
    sources: checksum(input.sourceRegisterText),
    taxonomy: validation.manifest.checksums.content,
    lexical: input.lexical.manifest.contentChecksum,
    concepts: checksum(CONTENT_CONCEPTS),
    gaps: checksum(FRENCH_TAXONOMY_V2_GAPS),
    coverage: checksum(coverage),
  };
  const content = {
    schemaVersion: 1 as const,
    release: FRENCH_TAXONOMY_V2_CANDIDATE.release,
    ontology: { version: "1.0.0" as const, document: "docs/french-ontology-v1.md" as const, checksum: componentChecksums.ontology },
    sources: { register: "docs/french-source-register.md" as const, checksum: componentChecksums.sources, keys: FRENCH_TAXONOMY_V2_CANDIDATE.sources.map((source) => source.key) },
    taxonomy: FRENCH_TAXONOMY_V2_CANDIDATE,
    lexicalRelease: {
      key: input.lexical.release.key,
      version: input.lexical.release.version,
      checksum: input.lexical.manifest.contentChecksum,
      report: input.lexical.report,
    },
    contentConcepts: CONTENT_CONCEPTS,
    gaps: FRENCH_TAXONOMY_V2_GAPS,
    validation,
    coverage,
  };
  return { ...content, manifest: { componentChecksums, contentChecksum: checksum(content) } };
}
