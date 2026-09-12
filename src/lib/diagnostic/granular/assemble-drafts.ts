import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../item-bank";
import {buildV3Facets} from "./facets";
import {validateAnnotationTarget,type TargetAnnotation} from "./facet-adapter";
export type DraftExpansion={version:string;status:"draft_requires_review";parentTaxonomyChecksum:string;sourceBankChecksum:string;items:CanonicalDiagnosticBankItem[];annotations:TargetAnnotation[];checksum:string};

/** Assemble authoring sources, never publish or transfer approval to an edit.
 * The unchanged base entries retain their own provenance; every added entry is
 * required to remain pending. Source and mapping drift fail before any write. */
export function assembleDraftBank(base:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate,expansions:readonly DraftExpansion[],options:{revision?:number;verbFamilyRecognition?:boolean}={}){
 if(options.revision!==undefined&&(!Number.isSafeInteger(options.revision)||options.revision<1||base.bank.key!=="french-diagnostic-bank-v3"))throw Error("A bank revision needs a positive integer and the original French v3 base");
 if(options.verbFamilyRecognition&&(options.revision===undefined||options.revision<36))throw Error('Verb-family recognition requires bank revision 36 or later');
 const baseline=validateCanonicalDiagnosticBank(base,taxonomy);
 if(baseline.issues.length)throw Error("Invalid source bank");
 const facets=buildV3Facets(taxonomy,options),keys=new Set(base.items.map(item=>item.itemKey));
 const annotations:TargetAnnotation[]=[],items=[...base.items],sources=[];
 const versions=new Set<string>();
 for(const expansion of expansions){
  const {checksum:expected,...content}=expansion;
  if(checksum(content)!==expected||expansion.status!=="draft_requires_review")throw Error("Invalid expansion envelope");
  if(versions.has(expansion.version))throw Error("Duplicate expansion source");versions.add(expansion.version);
  if(expansion.sourceBankChecksum!==baseline.manifest.checksum||expansion.parentTaxonomyChecksum!==base.taxonomy.checksum)throw Error("Stale expansion source");
  const mapped=new Map(expansion.annotations.map(annotation=>[annotation.itemKey,annotation]));
  if(mapped.size!==expansion.annotations.length||mapped.size!==expansion.items.length)throw Error("Each added question needs exactly one target mapping");
  for(const entry of expansion.items){
   if(keys.has(entry.itemKey))throw Error(`Duplicate item identity: ${entry.itemKey}`);keys.add(entry.itemKey);
   if(entry.reviewStatus!=="needs_human_review"||entry.qcGates.verdict!=="needs_human_review"||entry.review)throw Error("Expansion cannot introduce approval");
   const annotation=mapped.get(entry.itemKey);
   if(!annotation||annotation.itemChecksum!==checksum(entry)||!annotation.contextKey.trim())throw Error(`Stale item mapping: ${entry.itemKey}`);
   validateAnnotationTarget(annotation,entry,facets);
   items.push(entry);annotations.push(annotation);
  }
  sources.push({version:expansion.version,checksum:expected,addedItems:expansion.items.length});
 }
 const bank:CanonicalDiagnosticBankArtifact={...base,items};delete bank.manifest;
 if(options.revision!==undefined)bank.bank={key:`french-diagnostic-bank-v3-r${options.revision}`,version:`${base.bank.version}-r${options.revision}`};
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length)throw Error(`Invalid assembled draft: ${validation.issues.join("; ")}`);
 if(validation.eligibleItemKeys.some(key=>!baseline.eligibleItemKeys.includes(key)))throw Error("Assembly promoted draft content");
 bank.manifest=validation.manifest;
 return {bank,annotations,sources,sourceBankChecksum:baseline.manifest.checksum};
}
