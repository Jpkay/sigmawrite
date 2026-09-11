import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { DIRECT_OBJECT_TEACHING } from "../src/lib/diagnostic/granular/direct-object-teaching";
import { reviewDirectObjectPathways } from "../src/lib/diagnostic/granular/direct-object-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewDirectObjectPathways(assessment, assembled.bank, artifact.taxonomy, annotations, DIRECT_OBJECT_TEACHING);
const markdown = `# Direct-object identification lesson-to-check review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target sentences | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.distinctTargetSentences} | ${row.excludedTeachingOverlapQuestionIds.length} | ${row.guessingFloorValues.join(", ")} | ${row.minimumAllCorrectItemsForGuessGate} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Questions use the assessed sentence as their context identity, independently of task wording or question IDs. Repeated assessed sentences are retained at most once across the proposed pools, even if item IDs or instructions differ. Candidates whose annotated assessed sentence occurs in the lesson are excluded from both proposed pools. This detects exact normalized sentence reuse, not semantic paraphrases, complete exposure history or unannotated teaching material.

Four choices imply a 0.25 random-guess floor, requiring at least four correct answers for the chance gate. Distractor quality can make real guessing easier; the floor and difficulty require calibration. Graph accuracy and occasion criteria still apply. The pool split does not guarantee balanced coverage of sentence constructions or positive/negative cases.

Choosing a supplied grammatical explanation does not establish unaided explanation writing or pronoun production. Review target fit, cueing and teaching overlap before publishing any binding.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-direct-object-pathway-review.mts; append --check to verify.
`;

for(const [path,content] of [["docs/diagnostic/v3-direct-object-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-direct-object-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,sentences:row.distinctTargetSentences,allocation:row.proposedAllocationStatus})),null,2));
