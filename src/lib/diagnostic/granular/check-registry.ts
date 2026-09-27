import {inspectReleaseScope} from "./release-scope";
import {assessmentQuestionIds} from "./parallel-review-policy";
import {stableUuid} from "@/lib/lexicon/baseline";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import type {LearningActivityBinding} from "./activity-plan";
import {correctGuessChance,MAX_CONFIRMATION_GUESS_CHANCE} from "./engine";
import {readingPoolConflicts} from "./question-pools";

/** Build reviewable bindings from the actual eligible pool. Publishing a bundle
 * is a separate operation; this builder never fabricates publication approval. */
export function buildLearningCheckRegistry(assessment:V3Assessment,bank:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate){
 const scope=assessment.releaseScope===undefined?undefined:inspectReleaseScope(assessment.skills,assessment.releaseScope);
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length||validation.manifest.checksum!==assessment.bankChecksum)throw Error("Learning registry bank does not match assessment");
 if(bank.taxonomy.checksum!==assessment.taxonomyChecksum)throw Error("Learning registry taxonomy does not match assessment");
 const eligible=new Set(assessment.reviewPolicy===undefined?validation.eligibleItemKeys:assessmentQuestionIds(bank,taxonomy,assessment.reviewPolicy)),entries=new Map(bank.items.map(item=>[item.itemKey,item]));
 const skillById=new Map(assessment.skills.map(skill=>[skill.id,skill]));
 if(skillById.size!==assessment.skills.length)throw Error("Duplicate learning skill");
 const seen=new Set<string>();
 for(const probe of assessment.probes){
  const entry=entries.get(probe.id),skill=skillById.get(probe.skillId);
  if(scope&&!scope.assessmentSkillIds.has(probe.skillId))throw Error(`Learning probe outside release scope: ${probe.id}`);
  if(seen.has(probe.id))throw Error("Duplicate learning probe");seen.add(probe.id);
  if(!eligible.has(probe.id)||!entry||!skill||entry.item.nodeKey!==skill.nodeKey||entry.evidenceKey!==skill.evidenceKey||!skill.modes.includes(probe.mode))throw Error(`Ineligible or mismatched learning probe: ${probe.id}`);
 }
 const bindings:LearningActivityBinding[]=[];
 const repeatedReadingIds=new Set(readingPoolConflicts(assessment.probes).flatMap(conflict=>conflict.learningQuestionIds));
 const coverage=assessment.skills.flatMap(skill=>skill.modes.map(mode=>{
  const probes=assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===mode).sort((a,b)=>a.id.localeCompare(b.id));
  const minimumEvidenceItems=skill.evidenceRequirements?.[mode]?.minimumItems??3;
  const minimumInitialItems=skill.assessmentStage==="learning"?0:minimumEvidenceItems;
  // Budget for confirmation during learning even if initial questions are exhausted.
  const minimumLearningItems=Math.max(3,minimumEvidenceItems);
  const contexts=new Set(probes.map(p=>p.contextId));
  const checkProbes=probes.filter(p=>p.usage!=="initial"&&!repeatedReadingIds.has(p.id));
  const chanceCapacity=(pool:typeof probes)=>({allCorrectGuessChance:correctGuessChance(pool),meetsGuessThreshold:correctGuessChance(pool)<=MAX_CONFIRMATION_GUESS_CHANCE});
  const featureCoverage=(skill.evidenceRequirements?.[mode]?.featureRequirements??[]).map(requirement=>{
   const relevant=probes.filter(p=>p.evidenceFeatures?.includes(requirement.feature));
   return {...requirement,eligibleQuestions:relevant.length,distinctContexts:new Set(relevant.map(p=>p.contextId)).size,
    additionalEligibleQuestionsNeeded:Math.max(0,requirement.minimumItems*(skill.assessmentStage==="learning"?1:2)-relevant.length)};
  });
  if(checkProbes.length)bindings.push({id:stableUuid("granular-check-binding",`${skill.id}:${mode}`),nodeKey:skill.nodeKey,facetKey:skill.facetKey,mode,
   kind:"independent_check",status:"draft",titleFr:skill.labelFr,href:"/student/diagnostic",probeIds:checkProbes.map(p=>p.id),
   estimatedMinutes:Math.max(1,Math.ceil(Math.max(...checkProbes.map(p=>p.expectedSeconds))/60))});
  return {skillId:skill.id,...(scope?{availability:scope.assessmentSkillIds.has(skill.id)?"supported" as const:"deferred" as const}:{}),nodeKey:skill.nodeKey,facetKey:skill.facetKey??null,mode,eligibleQuestions:probes.length,distinctContexts:contexts.size,
   minimumContexts:skill.evidenceRequirements?.[mode]?.minimumContexts??1,minimumInitialItems,minimumLearningItems,featureCoverage,availableLearningQuestions:checkProbes.length,excludedRepeatedPassageQuestionIds:probes.filter(p=>repeatedReadingIds.has(p.id)).map(p=>p.id),
   guessingCapacity:{initial:chanceCapacity(probes.filter(p=>p.usage!=="learning")),learning:chanceCapacity(checkProbes)},
   // Count shortfall is a lower bound; contexts, guessing and feature coverage
   // can require more questions even when this value is zero.
   questionShortfallIsLowerBound:true,
   additionalEligibleQuestionsNeeded:Math.max(0,minimumInitialItems+minimumLearningItems-probes.length)};
 }));
 const content={version:"french-v3-learning-check-registry-v1",status:"draft_requires_review" as const,taxonomyChecksum:assessment.taxonomyChecksum,
  bankChecksum:assessment.bankChecksum,...(scope?{releaseScopeChecksum:checksum(scope.scope)}:{}),facetChecksum:assessment.facetChecksum??null,poolChecksum:assessment.poolChecksum??null,bindings,coverage};
 return {...content,checksum:checksum(content)};
}
