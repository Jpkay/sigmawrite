import {PERSON_NUMBER_DRAFTS} from "../src/lib/diagnostic/granular/person-number-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { PERSON_NUMBER_TEACHING } from "../src/lib/diagnostic/granular/person-number-teaching";
import { reviewPersonNumberPathways } from "../src/lib/diagnostic/granular/person-number-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewPersonNumberPathways(assessment, assembled.bank, artifact.taxonomy, annotations, PERSON_NUMBER_TEACHING);
const markdown = `# Person and number: teaching and assessment review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target sentences | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.distinctTargetSentences} | ${row.excludedTeachingOverlapQuestionIds.length} | ${row.guessingFloorValues.join(", ")} | ${row.minimumAllCorrectItemsForGuessGate} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Questions use the assessed sentence as their context identity, independently of task wording or question IDs. Repeated assessed sentences are retained at most once across the proposed pools, even if item IDs or instructions differ. Candidates whose annotated assessed sentence occurs in the lesson are excluded from both proposed pools. This detects exact normalized sentence reuse, not semantic paraphrases, complete exposure history or unannotated teaching material.

Six choices imply a 1/6 random-guess floor, requiring at least three correct answers for the chance gate. Distractor quality can make real guessing easier; the floor and difficulty require calibration. Graph accuracy and occasion criteria still apply. The category split is rechecked against the original evidence requirements. It does not guarantee balanced coverage of sentence constructions.

The subject is explicitly supplied. Choosing its grammatical person and number does not establish subject identification, verb production or free explanation. The bank has four cases per person/number combination, and the review allocator alternates each category between the two candidate pools, requiring every category in both. This reserves variety; it does not establish mastery of every category or force the live selector to ask one of each. Review grammatical versus referential number for on, polite vous and collective nouns, coordinated subjects and cues from verb endings. Review target fit, cueing and teaching overlap before publishing any binding.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-person-number-pathway-review.mts; append --check to verify.

## Category coverage

${report.rows.map(row=>`Balance: ${row.groupBalance}.\n\n| Category | Initial | Later |\n| --- | ---: | ---: |\n${row.groupCoverage?.map(group=>`| ${group.group} | ${group.initial} | ${group.later} |`).join("\n")}`).join("\n\n")}

A balance failure remains explicit even if the generic pool has enough questions overall. Taught or discarded questions are never restored to fill a category. The runtime adapter independently derives sampling categories from the same complete six-choice format. Its allocator balances available categories when the evidence contract permits, and its selector prefers less-tested categories within a skill/mode. It does not import this draft review packet. Category sampling does not require testing all six categories before the existing target-level stopping rule can be met.

## Assessment drafts

${PERSON_NUMBER_DRAFTS.map(draft=>`### ${draft.key}

${draft.prompt}

${[draft.answer,...draft.distractors].map(choice=>`- ${choice}`).join("\n")}

Answer: ${draft.answer}

Review rationale: ${draft.reason}`).join("\n\n")}

## Teaching draft

${PERSON_NUMBER_TEACHING.map(lesson=>`### ${lesson.titleFr}

${lesson.learnerQuestionFr}

${lesson.steps.map(step=>`${step.exampleFr}\n\n${step.explanationFr}`).join("\n\n")}

${lesson.takeawayFr}

Boundary: ${lesson.boundaryFr}

${lesson.practice.map(ex=>`${ex.promptFr}\n\n${ex.choices?.join(" / ")}\n\nAnswer: ${ex.answerFr}\nHint: ${ex.hintFr}\n${ex.explanationFr}`).join("\n\n")}`).join("\n\n")}
`;

for(const [path,content] of [["docs/diagnostic/v3-person-number-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-person-number-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,sentences:row.distinctTargetSentences,allocation:row.proposedAllocationStatus})),null,2));
