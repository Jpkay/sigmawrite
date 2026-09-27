import {SUBJECT_IDENTIFICATION_DRAFTS} from "../src/lib/diagnostic/granular/subject-identification-drafts";
import type {TargetAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
import {readFileSync,writeFileSync} from "node:fs";
import {AGREEMENT_DRAFTS} from "../src/lib/diagnostic/granular/agreement-drafts";
import {conjugate,UnsupportedVerbError} from "../src/lib/linguistic/conjugation";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==="accorder_sujet_verbe_ecrit");
const evidence=node.evidence.find((e:{key:string})=>e.key==="writing-controlled-production");
if(!evidence)throw Error("Missing approved evidence target");
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<TargetAnnotation & {reason:string;subjectFr:string;construction?:string}>=[];
// Authored answer keys for paradigms outside the local conjugator. They remain
// pending review and must not be described as computed validation.
const authoredForms:Record<string,string>={célébrer:"célèbrent",découvrir:"découvrent",courir:"courent",protéger:"protège",dormir:"dorment",attendre:"attendent",reprendre:"reprennent",apparaître:"apparaît",surprendre:"surprennent",cuire:"cuisent"};
// Opposite-number forms are also authored for unsupported/overridden paradigms.
// This conservative response-space model assumes the student knows the forms
// but is deciding which number the subject requires; it needs calibration.
const authoredContrasts:Record<string,string>={célébrer:"célèbre",découvrir:"découvre",courir:"court",protéger:"protègent",dormir:"dort",attendre:"attend",reprendre:"reprend",apparaître:"apparaissent",surprendre:"surprend",cuire:"cuit"};
for(const draft of AGREEMENT_DRAFTS){
 const key=`v3-agreement:${draft.key}`;let answer:string,computed=true;
 try{answer=conjugate(draft.verb,"present",draft.person);}catch(error){
  if(!(error instanceof UnsupportedVerbError)||!authoredForms[draft.verb])throw error;
  answer=authoredForms[draft.verb];computed=false;
 }
 if(authoredForms[draft.verb]){answer=authoredForms[draft.verb];computed=false;}
 const contrast=authoredContrasts[draft.verb]??conjugate(draft.verb,"present",draft.person==="3s"?"3p":"3s");
 if(contrast===answer)throw Error(`Agreement response space is not contrastive: ${key}`);
 const raw={nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:`Complète avec le verbe « ${draft.verb} » au présent.\n\n${draft.sentence}`,instructionsFr:"Écris seulement la forme du verbe qui manque.",correctAnswer:answer,acceptableAnswers:[],validatorType:computed?"conjugator":"exact",validatorConfig:{verb:draft.verb,tense:"present",person:draft.person,finiteResponseSpace:{alternatives:[answer,contrast],rationaleFr:"Si les formes du verbe sont connues, la décision d’accord oppose ici singulier et pluriel à la troisième personne. Plancher conservateur à calibrer; les choix ne sont pas montrés à l’élève."},materialExposure:{words:[{lemma:draft.verb,form:draft.verb},{lemma:draft.verb,form:answer}],sentences:[draft.sentence],assessed:{words:[draft.verb],sentences:[draft.sentence]}}},difficulty:50};
 const checked=await runGates(raw,{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid agreement draft: ${key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"subject-verb-agreement",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${draft.construction}`,contextKey:`agreement-sentence:${draft.key}`,reason:draft.reason,subjectFr:draft.subject});
}
const subjectNode=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==="identifier_sujet_verbe");
const subjectEvidence=subjectNode?.evidence.find((e:{key:string})=>e.key==="reading-receptive");
if(!subjectEvidence)throw Error("Missing approved subject-identification evidence");
for(const draft of SUBJECT_IDENTIFICATION_DRAFTS){
 if(!draft.sentence.includes(draft.verbForm)||!draft.sentence.includes(draft.subject))throw Error(`Unanchored subject draft: ${draft.key}`);
 const key=`v3-subject-identification:${draft.key}`;
 const checked=await runGates({nodeKey:subjectNode.key,strand:subjectNode.strand,modality:"reading",learnerMode:"shared",responseType:"mcq",
  promptFr:`${draft.sentence}\n\nQuel groupe de mots est le sujet du verbe « ${draft.verbForm} » ?`,
  instructionsFr:"Choisis le groupe sujet complet.",choices:[{text:draft.subject,correct:true},...draft.distractors.map(text=>({text,correct:false}))],
  validatorType:"exact",validatorConfig:{materialExposure:{sentences:[draft.sentence]}},difficulty:50,
 },{knownNodeKeys:new Set([subjectNode.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid subject draft: ${key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:subjectEvidence.key,evidenceExpectation:subjectEvidence.expectation,
  sectionKey:"conjugation",promptFamily:"identify-complete-subject",difficultyTier:"core",reviewStatus:"needs_human_review",
  qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({kind:"evidence",itemKey:key,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:subjectNode.key,evidenceKey:subjectEvidence.key},
  contextKey:`subject-sentence:${draft.key}`,construction:draft.construction,reason:draft.reason,subjectFr:draft.subject});
}
const expanded={...bank,items:[...bank.items,...items]};delete expanded.manifest;
const validation=validateCanonicalDiagnosticBank(expanded,artifact.taxonomy);
if(validation.issues.length)throw Error(validation.issues.join("\n"));
const content={version:"french-v3-agreement-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(bank,artifact.taxonomy).manifest.checksum,items,annotations};
writeFileSync("generated/french-v3-agreement-expansion.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n");
const summary={status:content.status,authoredItems:items.length,eligibleAdded:validation.eligibleItemKeys.filter(id=>id.startsWith("v3-agreement:")).length,targets:[...new Set(annotations.map(a=>a.kind==="evidence"?`${a.evidenceTarget.nodeKey}::${a.evidenceTarget.evidenceKey}`:a.facetKey))],limitations:["Form computation verifies the answer, not the linguistic role of the subject; subject mappings require review", "56 controlled-agreement questions and 16 separate subject-identification questions; agreement recognition and independent writing remain uncovered", "Subject identification uses the existing approved node; construction tags do not create separately approved mastery targets", "Uniform draft difficulty requires calibration; vocabulary familiarity can affect performance", "Coordinated examples cover distinct subjects joined by et; other coordination patterns are not covered", "Agreement drafts use a conservative binary guessing floor conditional on known verb forms; calibration is still required", "No copied approval or bank publication"]};
writeFileSync("docs/diagnostic/v3-agreement-expansion.json",JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify(summary,null,2));
