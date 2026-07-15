import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";import lexical from"../../../generated/french-baseline-lexicon.json";import{buildFrenchTaxonomyV1,FRENCH_TAXONOMY_V1_CANDIDATE}from"./french-v1";import type{BaselineLexiconArtifact}from"@/lib/lexicon/baseline";
const build=()=>buildFrenchTaxonomyV1({ontologyText:readFileSync("docs/french-ontology-v1.md","utf8"),sourceRegisterText:readFileSync("docs/french-source-register.md","utf8"),lexical:lexical as BaselineLexiconArtifact});
describe("French Taxonomy v1 release",()=>{
it("is deterministic and structurally publishable",()=>{expect(build()).toEqual(build());expect(build().validation.valid).toBe(true);});
it("publishes evidence and provenance for every node",()=>{expect(FRENCH_TAXONOMY_V1_CANDIDATE.nodes.every(n=>n.evidence.length>0&&n.sourceKeys.length>0)).toBe(true);expect(build().coverage.evidenceDefinitions).toBe(build().coverage.nodes);});
it("meets declared conjugation, reading, construction, concept and lexical scope",()=>{const c=build().coverage;expect(c.conjugationNodes).toBe(48);expect(c.readingNodes).toBe(40);expect(c.constructionNodes).toBe(33);expect(c.contentConcepts).toBe(12);expect(c.lexicalLemmas).toBeGreaterThanOrEqual(250);expect(c.lexicalHeldOutCoverage).toBeGreaterThanOrEqual(.8);});
it("retains unresolved gaps instead of hiding them",()=>{expect(build().gaps.length).toBeGreaterThanOrEqual(4);expect(build().gaps.some(g=>g.key==="lexical_corpus_scale")).toBe(true);});
});
