import {inspectQuestionMaterialCoverage} from "../src/lib/diagnostic/granular/material-coverage";
import {FRENCH_TEACHING_DRAFTS as teachingDrafts} from "../src/lib/diagnostic/granular/draft-teaching-catalogue";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import {auditHomophoneNovelty} from "../src/lib/diagnostic/granular/homophone-novelty-audit";
import {readFileSync, writeFileSync} from "node:fs";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {validateAnnotationReviewDraft} from "../src/lib/diagnostic/granular/annotation-review";
import {allocateQuestionPools} from "../src/lib/diagnostic/granular/question-pools";
import {buildLearningCheckRegistry} from "../src/lib/diagnostic/granular/check-registry";
import {validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankArtifact} from "../src/lib/diagnostic/item-bank";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";


// Recompute from source artifacts, never join potentially stale summary counts.
const read = (path:string) => JSON.parse(readFileSync(path,"utf8"));
const artifact = read("generated/french-taxonomy-v3.json");
const sourceBank = read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const assembled = assembleDraftBank(sourceBank,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)));
const bank = assembled.bank;
const annotationSource = read("docs/diagnostic/v3-facet-annotations.json");
const annotations = [...validateAnnotationReviewDraft(annotationSource,sourceBank),...assembled.annotations];
const base = adaptV3ForAssessment({artifact,bank});
const noveltyConflicts=new Set(auditHomophoneNovelty(base).filter(row=>!row.currentPoolsReady).map(row=>`${row.nodeKey}::${row.evidenceKey}`));
const facets = buildV3Facets(artifact.taxonomy);
const refined = applyFacetTargets(base,facets,bank,annotations);
const allocation = allocateQuestionPools(refined.assessment);
validateTeachingTargets(allocation.assessment,teachingDrafts);
const registry = buildLearningCheckRegistry(allocation.assessment,bank,artifact.taxonomy);
const validation = validateCanonicalDiagnosticBank(bank,artifact.taxonomy);
const eligible = new Set(validation.eligibleItemKeys);
const entries = new Map(bank.items.map(entry => [entry.itemKey,entry]));
const addedIds = new Set(assembled.annotations.map(annotation=>annotation.itemKey));

// Preserve every approved criterion alongside its runtime implementation status.
// This is an audit classification, not permission to weaken a graph contract.
const implementedCriteria = new Set(["negativeExamplesRequired","minimumContrastingErrors","minimumTextTypes","minimumAccuracy","minimumDistinctItems","minimumOccasions","minimumDistinctTexts","unaidedResponseRequired"]);
const partialCriteria = new Set(["minimumEligibleTokens","evidenceSpanRequired","unaidedTransferRequired","novelWordsRequired","novelSentencesRequired"]);
const rows = registry.coverage.map(coverage=>{
  const skill = allocation.assessment.skills.find(s=>s.id===coverage.skillId)!;
  const evidence = artifact.taxonomy.nodes.find((node:{key:string})=>node.key===skill.nodeKey)!.evidence.find((e:{key:string})=>e.key===skill.evidenceKey)!;
  const criteriaAudit = Object.entries(evidence.successCriteria).map(([criterion,required])=>({
    criterion,required,
    implementation:required===false?"not_required":implementedCriteria.has(criterion)?"implemented":partialCriteria.has(criterion)?"partial_requires_validation":"not_implemented",
  }));
  const unresolvedCriteria = criteriaAudit.filter(rule=>rule.implementation!=="implemented"&&rule.implementation!=="not_required");
  const pool = allocation.coverage.find(p=>p.skillId===skill.id&&p.mode===coverage.mode)!;
  const probes = allocation.assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===coverage.mode);
  const parentDrafts = bank.items.filter(entry=>entry.item.nodeKey===skill.nodeKey&&entry.evidenceKey===skill.evidenceKey&&!eligible.has(entry.itemKey)&&!addedIds.has(entry.itemKey));
  const targetedDrafts = assembled.annotations.filter(a=>(a.kind==="evidence"?a.evidenceTarget.nodeKey===skill.nodeKey&&!skill.facetKey:a.facetKey===skill.facetKey)&&entries.get(a.itemKey)?.evidenceKey===skill.evidenceKey);
  const targetTeachingDrafts = teachingDrafts.filter(lesson=>lesson.nodeKey===skill.nodeKey&&lesson.facetKey===skill.facetKey&&lesson.mode===coverage.mode);
  const materialCoverage={
    eligible:inspectQuestionMaterialCoverage(probes.map(probe=>entries.get(probe.id)!),skill.evidenceRequirements?.[coverage.mode]),
    exactTargetDrafts:inspectQuestionMaterialCoverage(targetedDrafts.map(annotation=>entries.get(annotation.itemKey)!),skill.evidenceRequirements?.[coverage.mode]),
    sharedParentDrafts:inspectQuestionMaterialCoverage(parentDrafts,skill.evidenceRequirements?.[coverage.mode]),
  };
  const missingRequiredMaterial=Object.values(materialCoverage).some(group=>group.missingRequiredIdentities.some(kind=>kind.questionIds.length));
  return {
    ...coverage, materialCoverage, labelFr:skill.labelFr, domain:skill.domain, samplingGroup:skill.samplingGroup, evidenceKey:skill.evidenceKey,
    refinementStatus:skill.facetKey?"draft_requires_review":"approved_parent_evidence",
    stage:skill.assessmentStage, prerequisites:skill.prerequisites,
    requirements:skill.evidenceRequirements?.[coverage.mode], approvedSuccessCriteria:evidence.successCriteria, criteriaAudit, pool,
    eligibleQuestionIds:probes.map(p=>p.id),
    eligibleFormats:[...new Set(probes.map(p=>entries.get(p.id)!.item.responseType))],
    // Shared parent candidates are not counted as exact-facet coverage.
    parentDraftCandidatesRequiringMapping:parentDrafts.map(e=>e.itemKey),
    exactTargetExpansionDrafts:targetedDrafts.map(a=>a.itemKey),
    teachingDrafts:targetTeachingDrafts.map(lesson=>({id:lesson.id,status:lesson.status,guidedExercises:lesson.practice.length,boundaryFr:lesson.boundaryFr})),
    activities:{instruction:"not_bound",practice:"not_bound",independentCheck:pool.status==="allocated"?"draft_binding":"insufficient_pool"},
    nextActions:[
      ...(missingRequiredMaterial?["annotate_required_assessed_material"]:[]),
      ...(noveltyConflicts.has(`${skill.nodeKey}::${skill.evidenceKey}`)?["review_fixed_pair_novelty_contract"]:[]),
      ...unresolvedCriteria.map(rule=>`enforce_approved_criterion:${rule.criterion}`),
      ...(skill.facetKey?["review_refinement_and_prerequisites"]:[]),
      ...(pool.status!=="allocated"?[targetedDrafts.length?"review_exact_target_drafts":parentDrafts.length?"map_and_review_parent_drafts":"author_missing_evidence"]:[]),
      ...(pool.status==="search_limit"?["resolve_pool_search_limit"]:[]),
      ...(targetTeachingDrafts.length?["review_teaching_scope_and_content"]:["author_or_reuse_exact_target_teaching"]),
      "bind_exact_target_instruction","bind_exact_target_practice","verify_independent_check_flow",
    ],
  };
});
const exactDraftAssignments = rows.flatMap(row=>row.exactTargetExpansionDrafts);
const teachingAssignments = rows.flatMap(row=>row.teachingDrafts.map(lesson=>lesson.id));
if(teachingAssignments.length!==teachingDrafts.length||new Set(teachingAssignments).size!==teachingDrafts.length)
  throw Error("Every teaching draft must appear on exactly one delivery target");
if(exactDraftAssignments.length!==addedIds.size||new Set(exactDraftAssignments).size!==addedIds.size)
  throw Error("Every expansion draft must appear on exactly one delivery target");
const covered = new Set(rows.map(row=>`${row.nodeKey}::${row.evidenceKey}`));
if(base.skills.some(skill=>!covered.has(skill.id))) throw Error("Approved evidence missing from delivery matrix");
if(new Set(rows.map(row=>`${row.skillId}:${row.mode}`)).size!==rows.length) throw Error("Duplicate delivery target");
const domains = [...new Set(rows.map(row=>row.domain))].map(domain=>{
  const targets=rows.filter(row=>row.domain===domain);
  return {domain,targets:targets.length,eligibleQuestions:targets.reduce((sum,row)=>sum+row.eligibleQuestions,0),
    targetsWithNoEligibleQuestions:targets.filter(row=>row.eligibleQuestions===0).length,
    allocatedPools:targets.filter(row=>row.pool.status==="allocated").length,
    targetsWithTeachingDrafts:targets.filter(row=>row.teachingDrafts.length>0).length,
    targetsWithoutTeachingDrafts:targets.filter(row=>row.teachingDrafts.length===0).length,
    guidedExerciseDrafts:targets.reduce((sum,row)=>sum+row.teachingDrafts.reduce((count,lesson)=>count+lesson.guidedExercises,0),0),
    exactTargetExpansionDrafts:targets.reduce((sum,row)=>sum+row.exactTargetExpansionDrafts.length,0)};
});
const content = {
  version:"french-v3-delivery-matrix-v1",status:"draft_requires_review",
  sources:{taxonomyChecksum:base.taxonomyChecksum,bankChecksum:base.bankChecksum,
    annotationChecksum:checksum(annotationSource),facetChecksum:allocation.assessment.facetChecksum,
    poolChecksum:allocation.assessment.poolChecksum,sourceBankChecksum:assembled.sourceBankChecksum,expansions:assembled.sources,teachingDraftChecksum:checksum(teachingDrafts)},
  summary:{teachingDrafts:teachingDrafts.length,targetsWithTeachingDrafts:rows.filter(row=>row.teachingDrafts.length>0).length,targetsWithoutTeachingDrafts:rows.filter(row=>row.teachingDrafts.length===0).length,totalCandidateQuestions:bank.items.length,additionalDraftQuestions:addedIds.size,canonicalEligibleQuestions:validation.eligibleItemKeys.length,approvedCompetencies:new Set(base.skills.map(s=>s.nodeKey)).size,approvedEvidenceDefinitions:base.skills.length,
    targets:rows.length,targetsWithNoveltyContractConflict:noveltyConflicts.size,targetsWithUnresolvedCriteria:rows.filter(row=>row.criteriaAudit.some(rule=>rule.implementation!=="implemented"&&rule.implementation!=="not_required")).length,eligibleMappedQuestions:allocation.assessment.probes.length,
    unsupportedEvidenceItemKeys:base.unsupportedEvidenceItemKeys??[],unassignedEligibleQuestions:refined.unassignedItemKeys,readingAllocationStatus:allocation.readingAllocationStatus,readingPassageConflicts:allocation.readingPassageConflicts,domains,
    samplingGroups:[...new Set(rows.map(row=>row.samplingGroup))].map(group=>({group,targets:rows.filter(row=>row.samplingGroup===group).length,eligibleQuestions:rows.filter(row=>row.samplingGroup===group).reduce((sum,row)=>sum+row.eligibleQuestions,0)}))},
  limitations:["Material coverage lists explicit assessed identities by candidate group; configured verbs and incidental context do not satisfy required target identities. Present identities do not establish freshness, semantic independence, complete history or approval.",
    "Draft refinements and annotations are not approved by this report",
    "Parent draft candidates may appear on several rows; never sum them as unique or exact-target coverage",
    "Expansion drafts are not eligible questions and do not satisfy pool requirements",
    "Activity status refers to exact-target bindings in this candidate, not the absence of all existing lessons",
    "This report is a local planning artifact, not a publication or calibration decision"],rows,
};
const json=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
const escape=(value:unknown)=>String(value).replaceAll("|","\\|").replaceAll("\n"," ");
const md=["# French v3 delivery matrix","",
  "Generated from the approved French graph and current local source artifacts. Drafts and eligible questions remain separate.","",
  "Regenerate: `npx tsx scripts/build-v3-delivery-matrix.mts`. Verify without writing: append `--check`.","",
  "## Domain overview","","| Domain | Targets | Eligible questions | Targets without eligible questions | Allocated pools | Expansion drafts |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...domains.map(d=>`| ${d.domain} | ${d.targets} | ${d.eligibleQuestions} | ${d.targetsWithNoEligibleQuestions} | ${d.allocatedPools} | ${d.exactTargetExpansionDrafts} |`),"",
  "## Exact-target teaching work","",
  "These counts describe authoring drafts, not approved lessons or published pathway bindings. A target without a draft may have reusable parent content; consult v3-teaching-reuse-audit.json before authoring a replacement.","",
  "| Domain | Targets with teaching drafts | Targets without teaching drafts | Guided exercise drafts |",
  "| --- | ---: | ---: | ---: |",
  ...domains.map(d=>`| ${d.domain} | ${d.targetsWithTeachingDrafts} | ${d.targetsWithoutTeachingDrafts} | ${d.guidedExerciseDrafts} |`),"",
  "## Sampling strands","","The selector balances these approved strands within each broad domain before selecting a finer branch. Lexical and grammatical spelling share the spelling time budget but receive separate sampling attention.","",
  ...content.summary.samplingGroups.map(group=>`- ${group.group}: ${group.targets} targets, ${group.eligibleQuestions} eligible questions`),"",
  "## Evidence enforcement gaps","",
  "Fourteen homophone evidence targets also have a fixed-pair novelty conflict. See `homophone-novelty-review.md`; adding more sentence drafts alone cannot satisfy the current target-word rule. The proposed correction is not approved or applied.","",
  "These approved requirements still need implementation or validation. A sufficient question pool alone does not make these targets releasable.","",
  ...[...new Set(rows.flatMap(row=>row.criteriaAudit.filter(rule=>rule.implementation!=="implemented"&&rule.implementation!=="not_required").map(rule=>rule.criterion)))].map(criterion=>`- ${criterion}: ${rows.filter(row=>row.criteriaAudit.some(rule=>rule.criterion===criterion&&rule.implementation!=="not_required")).length} targets`),"",
  "## Material annotation work","",
  "The accompanying JSON lists exact question IDs missing explicit assessed identities for each target, separately for eligible questions, exact-target drafts and shared parent drafts. Shared parent candidates still require mapping and can appear on several targets. Required word/sentence annotations follow the approved novelty criteria; absent annotations already prevent those pools from passing. Presence alone does not prove novelty or approval.","",
  ...["eligible","exactTargetDrafts","sharedParentDrafts"].map(group=>`- ${group}: ${rows.filter(row=>row.materialCoverage[group as keyof typeof row.materialCoverage].missingRequiredIdentities.some(kind=>kind.questionIds.length)).length} targets with missing required identities`),"",
  "## Target work queue","",
  "Full evidence requirements, prerequisite IDs, question IDs, source checksums and shared parent candidates are in the accompanying JSON. Every row still needs exact-target instruction and practice bindings. Expansion counts are unreviewed drafts, not coverage.","",
  "| Target | Mode / stage | Eligible | Initial / later | Exact question drafts | Teaching drafts / guided exercises | Next question action | Next teaching action |",
  "| --- | --- | ---: | --- | ---: | --- | --- | --- |",
  ...rows.map(r=>`| ${escape(r.labelFr)} | ${r.mode} / ${r.stage} | ${r.eligibleQuestions} | ${r.pool.initialItems} / ${r.pool.learningItems} (${r.pool.status}) | ${r.exactTargetExpansionDrafts.length} | ${r.teachingDrafts.length} / ${r.teachingDrafts.reduce((sum,lesson)=>sum+lesson.guidedExercises,0)} | ${escape(r.nextActions.find(a=>a.includes("draft")||a==="author_missing_evidence"||a==="review_fixed_pair_novelty_contract")??"complete_activity_bindings")} | ${r.teachingDrafts.length?"review_teaching_scope_and_content":"author_or_reuse_exact_target_teaching"} |`),"",
  "## Interpretation limits","",...content.limitations.map(l=>`- ${l}`),""].join("\n");
for(const [path,value] of [["docs/diagnostic/v3-delivery-matrix.json",json],["docs/diagnostic/v3-delivery-matrix.md",md]]){
  if(process.argv.includes("--check")){
    if(readFileSync(path,"utf8")!==value) throw Error(`Stale delivery matrix: ${path}`);
  }else writeFileSync(path,value);
}
console.log(JSON.stringify(content.summary,null,2));
