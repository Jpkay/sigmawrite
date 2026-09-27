import {readFileSync,writeFileSync} from "node:fs";
import {FRENCH_TEACHING_DRAFTS} from "../src/lib/diagnostic/granular/draft-teaching-catalogue";
import {buildTeachingReviewCatalogue} from "../src/lib/diagnostic/granular/teaching-review-catalogue";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment;
const report=buildTeachingReviewCatalogue(assessment,FRENCH_TEACHING_DRAFTS);
const markdown=`# French teaching draft review catalogue

${report.summary.lessons} lessons, ${report.summary.guidedExercises} guided exercises, ${report.summary.targets} exact assessment targets. No approval, publication or activity binding is created by this export.

The companion JSON includes the complete learner-facing content, answer keys, hints, feedback, target IDs, prerequisites, evidence requirements, material identities and per-lesson checksums. Review decisions must refer to the exact content version. An anchored annotation proves only that the annotated material appears in the lesson; it does not prove completeness or independence from assessment questions.

| Lesson | Target | Mode | Guided exercises | Exposure annotation |
| --- | --- | --- | ---: | --- |
${report.rows.map(row=>`| ${row.content.titleFr.replaceAll("|","\\|")} | ${row.skillId} | ${row.mode} | ${row.content.practice.length} | ${row.exposureAnnotationStatus} |`).join("\n")}

Missing exposure annotations: ${report.summary.missingExposureAnnotations.join(", ")||"none"}.

This inventory contains draft lessons only; it is not coverage of every approved French skill. Consult v3-delivery-matrix.json for targets still lacking suitable teaching and v3-teaching-reuse-audit.json for existing content to review before writing replacements. Publication still requires actual review and exact activity bindings.

Reproduce: npx tsx scripts/build-teaching-review-catalogue.mts. Add --check to verify without writing.
`;
for(const [path,value] of [["docs/diagnostic/v3-teaching-review-catalogue.json",JSON.stringify(report,null,2)+"\n"],["docs/diagnostic/v3-teaching-review-catalogue.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale teaching catalogue: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(report.summary));
