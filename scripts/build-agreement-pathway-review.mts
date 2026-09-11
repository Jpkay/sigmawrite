import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { AGREEMENT_TEACHING } from "../src/lib/diagnostic/granular/agreement-teaching";
import { reviewAgreementPathways } from "../src/lib/diagnostic/granular/agreement-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewAgreementPathways(assessment, assembled.bank, artifact.taxonomy, annotations, AGREEMENT_TEACHING);
const markdown = `# Subject–verb agreement lesson-to-check review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target verbs | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.distinctTargetWords} | ${row.excludedTeachingOverlapQuestionIds.length} | ${row.guessingFloorValues.join(", ")} | ${row.minimumAllCorrectItemsForGuessGate} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

The approved evidence rule requires fresh target words. The allocation uses annotated verb lemmas, not question IDs, and conservatively excludes candidates whose assessed material already occurs in the corresponding lesson. This check does not establish complete exposure history or rule out semantic overlap. Context vocabulary annotations require review as well.

The draft uses a conservative two-way guessing floor for the number decision, conditional on knowing the singular/plural forms. This is an explicit model assumption awaiting calibration, not a measured guessing rate. The chance threshold requires seven all-correct answers per pool under that assumption; the approved accuracy, novelty and occasion requirements remain additional conditions.

Subject selection and verb conjugation can both cause a wrong response. Review the difficulty and prerequisite fit of each question; these supplied-tense exercises alone cannot establish independent writing or identify the cause of every error. Multiple occasions are still required for mastery.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-agreement-pathway-review.mts; append --check to verify.
`;

for(const [path,content] of [["docs/diagnostic/v3-agreement-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-agreement-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,words:row.distinctTargetWords,allocation:row.proposedAllocationStatus})),null,2));
