import {readFileSync,writeFileSync} from "node:fs";
import {expandConjugationDraft} from "../src/lib/diagnostic/granular/conjugation-expansion";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../src/lib/diagnostic/item-bank";
import {checksum} from "../src/lib/taxonomy/validate";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const expansion=await expandConjugationDraft(bank,artifact.taxonomy);
const expanded={...bank,items:[...bank.items,...expansion.items]};delete expanded.manifest;
const checked=validateCanonicalDiagnosticBank(expanded,artifact.taxonomy);
if(checked.issues.length)throw Error(checked.issues.join("\n"));
const content={version:"french-v3-conjugation-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(bank,artifact.taxonomy).manifest.checksum,...expansion};

const summary={status:content.status,authoredItems:expansion.items.length,facetTargets:new Set(expansion.annotations.map(a=>a.facetKey)).size,eligibleAdded:checked.eligibleItemKeys.filter(k=>k.startsWith("v3-granular-forms:")).length,
 limitations:["Controlled form production, including supplied-tense sentence gaps; not tense choice or independent writing", "Uniform draft difficulty requires calibration", "No independent judgment or human approval performed", "Pattern confirmation must elicit distinctive forms, not just easy unchanged endings", "Rare imperative uses require review", "Supplied infinitives have anchored lemma identities; these do not identify tense/person mastery or prove semantic independence"],skipped:expansion.skipped};
for(const [path,value] of [["generated/french-v3-conjugation-expansion.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n"],["docs/diagnostic/v3-conjugation-expansion.json",JSON.stringify(summary,null,2)+"\n"]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale conjugation expansion: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(summary,null,2));
