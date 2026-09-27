import {DETERMINER_AGREEMENT_DRAFTS} from "../src/lib/diagnostic/granular/determiner-agreement-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { DETERMINER_AGREEMENT_TEACHING as ALL_DETERMINER_TEACHING } from "../src/lib/diagnostic/granular/determiner-agreement-teaching";
const DETERMINER_AGREEMENT_TEACHING=ALL_DETERMINER_TEACHING.filter(lesson=>lesson.mode==="recognition");
import { reviewDeterminerAgreementPathways } from "../src/lib/diagnostic/granular/determiner-agreement-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewDeterminerAgreementPathways(assessment, assembled.bank, artifact.taxonomy, annotations, DETERMINER_AGREEMENT_TEACHING);
const markdown = `# Determiner–noun agreement: teaching and assessment review

Draft feasibility only. No approval, publication or activation.

| Lesson | Drafts | Initial / later | Allocation |
| --- | ---: | --- | --- |
${report.rows.map(row=>`| ${row.titleFr} | ${row.unapprovedCandidates} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.proposedAllocationStatus} |`).join("\n")}

Twelve questions assess a determiner–noun construction and four assess its absence, including la, les and leur used as pronouns. The approved recognition evidence requires negative examples; merely offering wrong answers is not sufficient. The review allocator now carries the same source-bound counterexample and contrasting-error annotations as the runtime adapter. Every proposed pool must retain its required negative-example evidence.

Four choices give a 0.25 random-guess floor, requiring at least four all-correct answers for that chance gate. This estimate needs calibration. Choosing a supplied analysis is not independent explanation writing. Confirm that this format satisfies the intended recognition evidence before approving it. Production remains a separate target without coverage from these questions.

Exact taught sentences are excluded. This does not establish complete historical exposure or semantic independence. Review ambiguity, noun/determiner/pronoun distinctions, possessive agreement, lexical accessibility and meaningful learner explanations. The JSON records graph rules, prerequisites and content checksums.

## Assessment drafts

${DETERMINER_AGREEMENT_DRAFTS.map(draft=>`### ${draft.key}

${draft.prompt}

${[draft.answer,...draft.distractors].map(choice=>`- ${choice}`).join("\n")}

Answer: ${draft.answer}

Review rationale: ${draft.reason}`).join("\n\n")}

## Teaching draft

${DETERMINER_AGREEMENT_TEACHING.map(lesson=>`### ${lesson.titleFr}

${lesson.learnerQuestionFr}

${lesson.steps.map(step=>`${step.exampleFr}\n\n${step.explanationFr}`).join("\n\n")}

${lesson.takeawayFr}

Boundary: ${lesson.boundaryFr}

${lesson.practice.map(ex=>`${ex.promptFr}\n\n${ex.choices?.join(" / ")}\n\nAnswer: ${ex.answerFr}\nHint: ${ex.hintFr}\n${ex.explanationFr}`).join("\n\n")}`).join("\n\n")}
`;

for(const [path,content] of [["docs/diagnostic/v3-determiner-agreement-pathway-review.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-determiner-agreement-pathway-review.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==content)throw Error(`Stale review: ${path}`);}else writeFileSync(path,content);
}
console.log(JSON.stringify(report.rows.map(row=>({target:row.facetKey,drafts:row.unapprovedCandidates,sentences:row.distinctTargetSentences,allocation:row.proposedAllocationStatus})),null,2));
