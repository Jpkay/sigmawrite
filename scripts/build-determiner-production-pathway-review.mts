import {DETERMINER_PRODUCTION_DRAFTS} from "../src/lib/diagnostic/granular/determiner-production-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { DETERMINER_PRODUCTION_TEACHING } from "../src/lib/diagnostic/granular/determiner-production-teaching";
import { reviewDeterminerProductionPathways } from "../src/lib/diagnostic/granular/determiner-production-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewDeterminerProductionPathways(assessment, assembled.bank, artifact.taxonomy, annotations, DETERMINER_PRODUCTION_TEACHING);
const markdown = `# Determiner correction: controlled production review

Draft feasibility only. No approval, publication or activation.

| Lesson | Drafts | Guess floors | Initial / later | Allocation |
| --- | ---: | --- | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.unapprovedCandidates} | ${row.guessingFloorValues.join(", ")} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Twenty-four corrections require preserving the determiner family and possessor. The noun and other words must remain unchanged. No answer choices or target form are supplied, but the implicit answer space is small and declared per item. This is controlled production, not spontaneous writing or a claim of open-ended response difficulty.

Malformed determiner–noun groups in the prompts are intentional. Verify that only the marked determiner needs correction, that its family and possessor identify a unique answer, and that standard apostrophe and case variants are accepted. Noun gender knowledge, elision and lexical familiarity can confound interpretation of an error.

The original graph's fresh-sentence and occasion requirements remain in effect. Exact taught sentences and cross-question target exposure are excluded; semantic novelty and complete historical capture still require review. The pool allocation does not guarantee equal coverage of every determiner family.

## Assessment drafts

${DETERMINER_PRODUCTION_DRAFTS.map(draft=>`### ${draft.key}

${draft.sentence}\n\nCorrect only: ${draft.marked}



Answer: ${draft.answer}

Review rationale: ${draft.reason}`).join("\n\n")}

## Teaching draft

${DETERMINER_PRODUCTION_TEACHING.map(lesson=>`### ${lesson.titleFr}

${lesson.learnerQuestionFr}

${lesson.steps.map(step=>`${step.exampleFr}\n\n${step.explanationFr}`).join("\n\n")}

${lesson.takeawayFr}

Boundary: ${lesson.boundaryFr}

${lesson.practice.map(ex=>`${ex.promptFr}\n\n${ex.choices?.join(" / ")??""}\n\nAnswer: ${ex.answerFr}\nHint: ${ex.hintFr}\n${ex.explanationFr}`).join("\n\n")}`).join("\n\n")}
`;

for(const [path,content] of [["docs/diagnostic/v3-determiner-production-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-determiner-production-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,sentences:row.distinctTargetSentences,allocation:row.proposedAllocationStatus})),null,2));
