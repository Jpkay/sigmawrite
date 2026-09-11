import {readFileSync,writeFileSync} from "node:fs";
import {CANONICAL_SENTENCE_EXAMPLES,CANONICAL_SENTENCE_PRODUCTION} from "../src/lib/diagnostic/granular/canonical-sentence-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==="construction_phrase_canonique");
if(!node)throw Error("Missing approved canonical-sentence node");
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const mode of ["recognition","production"] as const){
 const examples=mode==="recognition"?CANONICAL_SENTENCE_EXAMPLES:CANONICAL_SENTENCE_PRODUCTION;
 const evidenceKey=mode==="recognition"?"reading-analysis":"writing-controlled-production";
 const evidence=node.evidence.find((e:{key:string})=>e.key===evidenceKey);
 if(!evidence)throw Error(`Missing approved evidence ${evidenceKey}`);
 for(const [index,[subject,verb,object]] of examples.entries()){
  // Every fourth recognition item omits the verb. It is a real absence case,
  // not merely a wrong spelling or a correct sentence labelled negative.
  const negative=mode==="recognition"&&index%4===3;
  const sentence=negative?`${subject}, ${object}.`:`${subject} ${verb} ${object}.`;
  const answer=negative?"Il manque un verbe conjugué pour former une phrase verbale complète.":`« ${subject} » est le sujet, « ${verb} » est le verbe et « ${object} » est son complément.`;
  const choices=negative?[answer,"Le sujet est placé après le verbe.","La phrase suit l’ordre sujet, verbe, complément.","Le complément est placé avant le sujet."]:[answer,`« ${object} » est le sujet et « ${subject} » est le complément du verbe.`,`« ${verb} » est le sujet et « ${subject} » est le verbe.`,"Il manque un verbe conjugué."];
  const prompt=mode==="recognition"?`${sentence}\n\nQuelle analyse décrit cette phrase ?`:`Remets ces trois groupes dans l’ordre sujet, verbe, complément. Recopie la phrase complète sans ajouter de mots.\n\n${object} / ${subject} / ${verb}`;
  const full=`${subject} ${verb} ${object}.`;
  const permutations=[[subject,verb,object],[subject,object,verb],[verb,subject,object],[verb,object,subject],[object,subject,verb],[object,verb,subject]].flatMap(parts=>[parts.join(" ")+".",parts.join(" ")]);
  const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:mode==="recognition"?"reading":"writing",learnerMode:"shared",responseType:mode==="recognition"?"mcq":"cloze",promptFr:prompt,instructionsFr:mode==="recognition"?"Choisis une réponse.":"Écris la phrase complète.",...(mode==="recognition"?{choices:choices.map((text,i)=>({text,correct:i===0}))}:{correctAnswer:full,acceptableAnswers:[full.slice(0,-1)]}),validatorType:"exact",difficulty:50,validatorConfig:{materialExposure:{sentences:[mode==="recognition"?sentence:prompt],assessed:{sentences:[mode==="recognition"?sentence:prompt]}},...(negative?{negativeExample:{excerptFr:sentence,rationaleFr:"Ce groupe de mots ne contient aucun verbe conjugué."}}:{}),...(mode==="production"?{finiteResponseSpace:{alternatives:permutations,rationaleFr:"Trois groupes à ordonner offrent six permutations. La saisie ne transforme pas cette tâche en production ouverte."}}:{})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
  if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid canonical-sentence ${mode} ${index}: ${JSON.stringify(checked.gates)}`);
  questionMaterialKeys(checked.item);
  const itemKey=`v3-canonical-sentence:${mode}-${index+1}`;
  const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey,evidenceExpectation:evidence.expectation,sectionKey:"grammar",promptFamily:"canonical-sentence-constituents",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
  canonicalProbeMetrics(entry);
  items.push(entry);annotations.push({kind:"evidence",itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey},contextKey:`canonical-sentence:${mode}-${index+1}`,reason:negative?"Repérer l’absence de noyau verbal.":"Identifier ou reconstruire l’ordre sujet, verbe et complément dans une phrase nouvelle."});
 }
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length)throw Error(validation.issues.join("\n"));
const content={version:"french-v3-canonical-sentence-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path="generated/french-v3-canonical-sentence-expansion.json",serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==serialized)throw Error("Stale canonical-sentence expansion");}else writeFileSync(path,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status}));
