import { checksum, validateTaxonomy, type TaxonomyCandidate } from "./validate";
import { CONJUGATION_FOUNDATION_CANDIDATE } from "./slices/conjugation-foundation";
import { READING_FOUNDATION_CANDIDATE } from "./slices/reading-comprehension-foundation";
import { CONSTRUCTION_CROSS_SLICE_EDGES, CONSTRUCTION_FOUNDATION_CANDIDATE } from "./slices/construction-foundation";
import { CONTENT_CONCEPTS } from "@/lib/content/concepts";
import type { BaselineLexiconArtifact } from "@/lib/lexicon/baseline";

export const FRENCH_TAXONOMY_V1_CANDIDATE: TaxonomyCandidate = {
  release: { key: "french-taxonomy-v1", version: "1.0.0", ontologyVersion: "1.0.0" },
  sources: CONJUGATION_FOUNDATION_CANDIDATE.sources,
  nodes: [
    ...CONJUGATION_FOUNDATION_CANDIDATE.nodes,
    ...READING_FOUNDATION_CANDIDATE.nodes,
    ...CONSTRUCTION_FOUNDATION_CANDIDATE.nodes,
  ],
  edges: [
    ...CONJUGATION_FOUNDATION_CANDIDATE.edges,
    ...READING_FOUNDATION_CANDIDATE.edges,
    ...CONSTRUCTION_FOUNDATION_CANDIDATE.edges,
    ...CONSTRUCTION_CROSS_SLICE_EDGES,
  ],
};

export const FRENCH_TAXONOMY_V1_GAPS = [
  { key: "advanced_compound_tenses", severity: "planned", note: "Futur antérieur, conditionnel passé, subjonctif passé et passé antérieur sont prévus après v1." },
  { key: "oral_modalities", severity: "planned", note: "Le pilote v1 privilégie lecture et écriture; les preuves orales détaillées restent à étendre." },
  { key: "lexical_corpus_scale", severity: "known_limit", note: "La fréquence v1 provient du corpus pilote SigmaWrite et ne représente pas une fréquence générale du français." },
  { key: "provisional_progression_boundaries", severity: "review_required", note: "Les limites de niveau restent provisoires à l'échelle du nœud et seront recalibrées avec preuves éducatives et empiriques." },
] as const;

export type FrenchTaxonomyV1Artifact = {
  schemaVersion: 1;
  release: TaxonomyCandidate["release"];
  ontology: { version: "1.0.0"; document: "docs/french-ontology-v1.md"; checksum: string };
  sources: { register: "docs/french-source-register.md"; checksum: string; keys: string[] };
  taxonomy: TaxonomyCandidate;
  lexicalRelease: { key: string; version: string; checksum: string; report: BaselineLexiconArtifact["report"] };
  contentConcepts: typeof CONTENT_CONCEPTS;
  gaps: typeof FRENCH_TAXONOMY_V1_GAPS;
  validation: ReturnType<typeof validateTaxonomy>;
  coverage: {
    nodes: number; edges: number; evidenceDefinitions: number; progressionMappings: number;
    conjugationNodes: number; readingNodes: number; constructionNodes: number; contentConcepts: number;
    lexicalLemmas: number; lexicalForms: number; lexicalHeldOutCoverage: number;
  };
  manifest: { componentChecksums: Record<string,string>; contentChecksum: string };
};

export function buildFrenchTaxonomyV1(input: { ontologyText:string; sourceRegisterText:string; lexical:BaselineLexiconArtifact }): FrenchTaxonomyV1Artifact {
  const validation=validateTaxonomy(FRENCH_TAXONOMY_V1_CANDIDATE);
  if(!validation.valid)throw new Error(`French Taxonomy v1 is invalid: ${validation.issues.map(i=>i.code).join(",")}`);
  const coverage={
    nodes:FRENCH_TAXONOMY_V1_CANDIDATE.nodes.length,
    edges:FRENCH_TAXONOMY_V1_CANDIDATE.edges.length,
    evidenceDefinitions:FRENCH_TAXONOMY_V1_CANDIDATE.nodes.reduce((s,n)=>s+n.evidence.length,0),
    progressionMappings:FRENCH_TAXONOMY_V1_CANDIDATE.nodes.reduce((s,n)=>s+n.mappings.length,0),
    conjugationNodes:CONJUGATION_FOUNDATION_CANDIDATE.nodes.length,
    readingNodes:READING_FOUNDATION_CANDIDATE.nodes.length,
    constructionNodes:CONSTRUCTION_FOUNDATION_CANDIDATE.nodes.length,
    contentConcepts:CONTENT_CONCEPTS.length,
    lexicalLemmas:input.lexical.report.lemmaCount,
    lexicalForms:input.lexical.report.formCount,
    lexicalHeldOutCoverage:input.lexical.report.heldOutCoverage,
  };
  const componentChecksums={
    ontology:checksum(input.ontologyText),sources:checksum(input.sourceRegisterText),
    taxonomy:validation.manifest.checksums.content,lexical:input.lexical.manifest.contentChecksum,
    concepts:checksum(CONTENT_CONCEPTS),gaps:checksum(FRENCH_TAXONOMY_V1_GAPS),coverage:checksum(coverage),
  };
  const content={schemaVersion:1 as const,release:FRENCH_TAXONOMY_V1_CANDIDATE.release,
    ontology:{version:"1.0.0" as const,document:"docs/french-ontology-v1.md" as const,checksum:componentChecksums.ontology},
    sources:{register:"docs/french-source-register.md" as const,checksum:componentChecksums.sources,keys:FRENCH_TAXONOMY_V1_CANDIDATE.sources.map(s=>s.key)},
    taxonomy:FRENCH_TAXONOMY_V1_CANDIDATE,
    lexicalRelease:{key:input.lexical.release.key,version:input.lexical.release.version,checksum:input.lexical.manifest.contentChecksum,report:input.lexical.report},
    contentConcepts:CONTENT_CONCEPTS,gaps:FRENCH_TAXONOMY_V1_GAPS,validation,coverage};
  return{...content,manifest:{componentChecksums,contentChecksum:checksum(content)}};
}
