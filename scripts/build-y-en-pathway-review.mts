import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { Y_EN_TEACHING } from "../src/lib/diagnostic/granular/y-en-teaching";
import { reviewYEnPathways } from "../src/lib/diagnostic/granular/y-en-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewYEnPathways(assessment, assembled.bank, artifact.taxonomy, annotations, Y_EN_TEACHING);
const markdown = `# Y/en transformation lesson-to-check review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target sentences | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.distinctTargetSentences} | ${row.excludedTeachingOverlapQuestionIds.length} | ${row.guessingFloorValues.join(", ")} | ${row.minimumAllCorrectItemsForGuessGate} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Questions use the exact assessed sentence as context identity. Sentences shown in any of the five supplied lessons are excluded from every proposed pool, including cross-lesson exposure. Repeated assessed sentences within a target are retained at most once. The JSON binds the entire supplied lesson set by checksum. Semantic paraphrases, unannotated examples and earlier learner activity remain outside this exact-match check.

The conditional y/en choice model uses a conservative 0.5 floor, requiring seven correct answers per pool for the chance gate. This does not calibrate full-sentence difficulty. Placement, elision and quantity retention can cause errors; a wrong answer does not uniquely identify the underlying gap. Review prerequisites and the attribution of results before publishing.

No question or lesson is approved by a feasible split. Fine-grained mappings, multiple occasions, answer variants, teaching overlap and calibration remain review requirements.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-y-en-pathway-review.mts; append --check to verify.
`;

for(const [path,content] of [["docs/diagnostic/v3-y-en-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-y-en-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,sentences:row.distinctTargetSentences,allocation:row.proposedAllocationStatus})),null,2));
