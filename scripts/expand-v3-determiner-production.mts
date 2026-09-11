import {readFileSync,writeFileSync} from "node:fs";
import {DETERMINER_PRODUCTION_DRAFTS} from "../src/lib/diagnostic/granular/determiner-production-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const draft of DETERMINER_PRODUCTION_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key===draft.nodeKey),evidence=node.evidence.find((evidence:{key:string})=>evidence.key==="writing-controlled-production");
 const forms=/^(Le|La)$/.test(draft.marked)?["le","la","l’","les"]:/^(Un|Une|Des)$/.test(draft.marked)?["un","une","des"]:/^(Ce|Cet|Cette)$/.test(draft.marked)?["ce","cet","cette","ces"]:/^(Mon|Ma)$/.test(draft.marked)?["mon","ma","mes"]:/^(Ton|Ta)$/.test(draft.marked)?["ton","ta","tes"]:draft.marked==="Son"?["son","sa","ses"]:draft.marked==="Notre"?["notre","nos"]:draft.marked==="Vos"?["votre","vos"]:["leur","leurs"];
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:`${draft.sentence}\n\nCorrige seulement le déterminant « ${draft.marked} » pour qu’il convienne au nom. Garde la même famille de déterminants et, s’il indique une possession, la même personne qui possède. Écris uniquement le déterminant corrigé.`,instructionsFr:"Les autres mots restent inchangés.",correctAnswer:draft.answer,acceptableAnswers:[],validatorType:"exact",difficulty:50,validatorConfig:{finiteResponseSpace:{alternatives:forms,rationaleFr:"La famille du déterminant est imposée; seules ses formes peuvent être choisies. La saisie n’est pas une production ouverte."},materialExposure:{sentences:[draft.sentence],assessed:{sentences:[draft.sentence]}}}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected draft: ${draft.key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:`v3-determiner-production:${draft.key}`,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"correct-determiner-preserving-family",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({kind:"evidence",itemKey:entry.itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`determiner-correction:${draft.key}`,reason:draft.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>key.startsWith("v3-determiner-production:")))throw Error(`Invalid draft expansion: ${validation.issues.join("; ")}`);
const content={version:"french-v3-determiner-production-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path="generated/french-v3-determiner-production-expansion.json",serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==serialized)throw Error("Stale determiner production expansion");}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,status:content.status}));
