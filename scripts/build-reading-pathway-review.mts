import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { READING_TEACHING } from "../src/lib/diagnostic/granular/reading-teaching";
import { reviewReadingPathways } from "../src/lib/diagnostic/granular/reading-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewReadingPathways(assessment, assembled.bank, artifact.taxonomy, READING_TEACHING);
const markdown = `# Reading lesson-to-check review

Draft feasibility only. No approval, publication or live activation. Counts of unapproved passages are review capacity, not eligible coverage.

| Lesson | Eligible | Draft candidates | Distinct passages | Initial / later | Allocation |
| --- | ---: | ---: | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.distinctPassages} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Every candidate must have a valid source-bound textual-support question. Exactly repeated passages share a context even when their IDs differ. Exact annotated passages shown anywhere in the supplied lesson set are excluded. Semantic paraphrases, unannotated excerpts and earlier activity still require review. The original bank, statuses, graph and runtime release remain unchanged.

The companion JSON pins lessons, questions, passage identities, target evidence rules and prerequisites. It proposes separate initial and follow-up pools, but does not waive unresolved evidence-enforcement requirements or validate calibration. One text genre per refined target cannot establish competence across every genre.

Reproduce: npx tsx scripts/build-reading-pathway-review.mts; append --check to verify.
`;
for(const [path,content] of [["docs/diagnostic/v3-reading-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-reading-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,passages:row.distinctPassages,allocation:row.proposedAllocationStatus})),null,2));
