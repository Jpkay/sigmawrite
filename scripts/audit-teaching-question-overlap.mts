import {readFileSync,writeFileSync} from "node:fs";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import {FRENCH_TEACHING_DRAFTS} from "../src/lib/diagnostic/granular/draft-teaching-catalogue";
import {auditTeachingOverlap} from "../src/lib/diagnostic/granular/teaching-overlap-audit";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const {bank}=assembleDraftBank(base,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)));
const report=auditTeachingOverlap(bank,artifact.taxonomy,FRENCH_TEACHING_DRAFTS);
const rows=report.rows.filter(row=>row.overlaps.length);
const markdown=`# Teaching-to-question exposure audit

${report.summary.questions} candidate questions checked against ${report.summary.lessons} draft lessons. ${report.summary.questionsWithExactOverlap} questions have exact target-material overlap, including ${report.summary.eligibleQuestionsWithExactOverlap} canonically eligible questions. No questions were removed or approved.

Overlap is conditional: a question becomes exposed when the relevant lesson is shown to that learner. This report does not assume every learner has seen every lesson, and it is not a list of globally invalid questions. Compare it with the student's recorded exposure before using a question as fresh evidence.

${report.summary.questionsWithoutMaterialIdentity} questions have no assessed material identity, and ${report.summary.unresolvedReadingSources} reading sources could not be resolved. Zero reported overlap for those items is not proof of independence. ${report.summary.lessonsWithoutMaterialIdentity} lessons have no material identity.

${report.summary.questionsWithOnlyConfiguredVerbIdentity} otherwise unannotated conjugation questions identify a verb in validator configuration. ${report.summary.questionsWithConfiguredVerbOverlap} questions have a potential taught-lemma match through that metadata. These are recorded separately in JSON: the same verb at another tense/person is not automatically the same assessed task, and configured metadata is not a reviewed exposure annotation. ${report.summary.questionsWithoutAnyReviewedOrConfiguredIdentity} questions have neither an assessed identity nor a configured conjugator verb.

The audit compares explicit assessed word/sentence identities and whole source passages for reading against all annotated teaching material. It does not prove semantic independence, correct lemma mapping, complete annotation, partial-passage overlap or complete historical exposure. Incidental vocabulary is not automatically treated as an assessed target. Recognition/production mode and source IDs do not make identical taught material fresh again.

| Question | Canonically eligible | Lessons exposing target material |
| --- | --- | --- |
${rows.map(row=>`| ${row.questionId} | ${row.canonicalEligible} | ${[...new Set(row.overlaps.map(overlap=>overlap.lessonId))].join(", ")} |`).join("\n")}

The JSON retains every question, including unresolved/unannotated ones, source checksums and matching material keys. Reproduce with npx tsx scripts/audit-teaching-question-overlap.mts; append --check to verify without writing.
`;
for(const [path,value] of [["docs/diagnostic/v3-teaching-question-overlap.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-teaching-question-overlap.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale overlap audit: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(report.summary));
