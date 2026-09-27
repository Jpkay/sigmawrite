import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import { readFileSync, writeFileSync } from "node:fs";
import { assembleDraftBank } from "../src/lib/diagnostic/granular/assemble-drafts";
import { adaptV3ForAssessment } from "../src/lib/diagnostic/granular/v3-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { validateAnnotationReviewDraft } from "../src/lib/diagnostic/granular/annotation-review";
import { CONJUGATION_TEACHING } from "../src/lib/diagnostic/granular/conjugation-teaching";
import { reviewConjugationPathways } from "../src/lib/diagnostic/granular/conjugation-pathway-review";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, FRENCH_DRAFT_EXPANSION_SOURCES.map(name => read(`generated/french-v3-${name}-expansion.json`)));
const annotations = [...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"), base), ...assembled.annotations];
const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank: assembled.bank }), buildV3Facets(artifact.taxonomy), assembled.bank, annotations).assessment;
const report = reviewConjugationPathways(assessment, assembled.bank, artifact.taxonomy, CONJUGATION_TEACHING);
const markdown = `# Conjugation lesson-to-check review

Draft feasibility only. No approvals, publication or live activation. Counts include unapproved candidate questions solely to plan the review; they are not eligible production coverage.

| Lesson | Eligible | Unapproved candidates | All candidates: initial / later | Sentence-only initial / later | Sentence-only allocation |
| --- | ---: | ---: | --- | --- | --- |
${report.rows.map(row => `| ${row.titleFr} | ${row.eligibleQuestions} | ${row.unapprovedCandidates} | ${row.proposedInitialQuestions.length} / ${row.proposedLaterQuestions.length} | ${row.sentenceApplicationPools.initialQuestionIds.length} / ${row.sentenceApplicationPools.laterQuestionIds.length} | ${row.sentenceApplicationPools.status} |`).join("\n")}

The companion JSON pins every lesson, question and target, retains all prerequisites and lists proposed disjoint question pools. Allocation checks the current evidence requirements, including the ger/cer spelling feature counts and verb-context diversity. It does not validate whether paraphrased isolated form prompts supply independent evidence.

The original form questions ask for a verb given its subject and tense. New sentence-based application drafts now cover all eighteen lesson targets. Teaching-overlap and pedagogical review are still needed before claiming contextual transfer. A new question ID or a rearranged instruction alone does not prove independence. Sentence counts refer to source-anchored annotations, not an automated semantic review.

## Added sentence questions requiring review

These supplied-tense gaps exercise regular forms, individual verbs and the actual nous spelling changes. They do not assess selecting a tense or independent connected writing. The conservative verb-context grouping remains unchanged.

${assembled.bank.items.filter(entry => entry.promptFamily === "sentence-form-application").map(entry => `- **${entry.itemKey}**: ${entry.item.promptFr} Réponse : **${entry.item.correctAnswer}**.`).join("\n")}

All eighteen paths still require question, lesson, overlap, prerequisite and calibration review. The full French release also needs the other targets; this is a review package for one part of that release, not a reduced release scope.

Reproduce: \`npx tsx scripts/build-conjugation-pathway-review.mts\`; append \`--check\` to verify.
`;
for (const [path, content] of [["docs/diagnostic/v3-conjugation-pathway-review.json", JSON.stringify(report, null, 2) + "\n"], ["docs/diagnostic/v3-conjugation-pathway-review.md", markdown]]) {
  if (process.argv.includes("--check")) { if (readFileSync(path, "utf8") !== content) throw Error(`Stale review: ${path}`); }
  else writeFileSync(path, content);
}
console.log(JSON.stringify(report.rows.map(row => ({ lessonId: row.lessonId, eligible: row.eligibleQuestions, draftCandidates: row.unapprovedCandidates, allocation: row.proposedAllocationStatus, annotatedSentences: row.sentenceContextQuestions })), null, 2));
