import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../item-bank";
import {buildV3Facets} from "./facets";
import {validateAnnotationTarget,type TargetAnnotation} from "./facet-adapter";
export type DraftExpansion={version:string;status:"draft_requires_review";parentTaxonomyChecksum:string;sourceBankChecksum:string;items:CanonicalDiagnosticBankItem[];annotations:TargetAnnotation[];checksum:string};
const R44_LOCAL_GRAMMAR_PROMPT_OVERRIDES=[
 {itemKey:"local-grammar-v1:construction_negation_simple:receptive:foundation",before:"Quelle phrase contient une négation simple ?",after:"Quelle phrase dit qu’une action ne se produit pas ?"},
 {itemKey:"local-grammar-v1:construction_subordonnee_relative:receptive:core",before:"Dans quelle phrase « dont » introduit-il une relative ?",after:"Dans quelle phrase le mot « dont » ajoute-t-il une précision sur un nom ?"},
] as const;
const R45_PLAIN_LANGUAGE_PROMPT_OVERRIDES=[
 {itemKey:"computed-conjugation-v1:produire_present_indicatif:foundation",before:"Conjugue « parler » au présent avec « tu ». Écris seulement la forme verbale.",after:"Avec « tu », écris « parler » pour dire ce qui se passe maintenant. Écris seulement le verbe."},
 {itemKey:"computed-conjugation-v1:produire_present_indicatif:core",before:"Complète au présent : Nous ___ ce travail aujourd’hui. (finir) Écris seulement la forme verbale.",after:"Complète avec « finir » pour dire ce qui se passe maintenant : Nous ___ ce travail aujourd’hui. Écris seulement le verbe."},
 {itemKey:"computed-conjugation-v1:produire_present_indicatif:stretch",before:"Remplace « je viens » par la forme correspondant à « ils », au présent. Écris seulement la forme verbale.",after:"La phrase dit « je viens ». Réécris seulement le verbe pour parler de plusieurs personnes avec « ils »."},
 {itemKey:"computed-conjugation-v1:produire_futur_proche:foundation",before:"Conjugue « parler » au futur proche avec « je ». Écris seulement le groupe verbal.",after:"Avec « je », écris une forme d’aller suivie de « parler » pour annoncer ce qui va se passer. Écris seulement les deux verbes."},
 {itemKey:"computed-conjugation-v1:produire_futur_proche:core",before:"Complète au futur proche : Nous ___ ce soir. (finir) Écris seulement le groupe verbal.",after:"Complète avec une forme d’aller suivie de « finir » pour annoncer ce qui va se passer : Nous ___ ce soir. Écris seulement les deux verbes."},
 {itemKey:"computed-conjugation-v1:produire_futur_proche:stretch",before:"Mets « ils partent » au futur proche. Écris seulement le groupe verbal.",after:"Transforme « ils partent » pour annoncer ce qui va se passer, avec une forme d’aller suivie de « partir ». Écris seulement les deux verbes."},
 {itemKey:"local-spelling-gap-v1:accorder_determinant_nom_ecrit:receptive:foundation",before:"Quel groupe associe correctement le déterminant et le nom ?",after:"Quel groupe de mots est écrit correctement ?"},
 {itemKey:"local-spelling-gap-v1:accorder_determinant_nom_ecrit:receptive:core",before:"Quel groupe associe correctement le déterminant et le nom ?",after:"Quel groupe de mots est écrit correctement ?"},
 {itemKey:"local-spelling-gap-v1:accorder_determinant_nom_ecrit:receptive:stretch",before:"Quel groupe associe correctement le déterminant et le nom ?",after:"Quel groupe de mots est écrit correctement ?"},
 {itemKey:"review-draft-v1:accorder_determinant_nom_ecrit:controlled_production:foundation",before:"Mets ce groupe au pluriel : « un arbre ». Écris le déterminant et le nom. Garde le même type de déterminant.",after:"Transforme « un arbre » pour parler de plusieurs arbres. Écris les deux mots et garde un mot de la famille un, une, des."},
 {itemKey:"review-draft-v1:accorder_determinant_nom_ecrit:controlled_production:core",before:"Mets ce groupe au pluriel : « un monsieur ». Écris le déterminant et le nom. Garde le même type de déterminant.",after:"Transforme « un monsieur » pour parler de plusieurs messieurs. Écris les deux mots et garde un mot de la famille un, une, des."},
 {itemKey:"review-draft-v1:accorder_determinant_nom_ecrit:controlled_production:stretch",before:"Mets ce groupe au pluriel : « le chat ». Écris le déterminant et le nom. Garde le même type de déterminant.",after:"Transforme « le chat » pour parler de plusieurs chats. Écris les deux mots et garde un mot de la famille le, la, les."},
] as const;

/** Revision 44 carries two reviewed copy fixes whose canonical authoring source is
 * newer than the frozen v3 base artifact. Apply them only after expansion
 * provenance has been checked against that base, and fail if the expected source
 * text has drifted. */
function applyPromptOverrides(items:readonly CanonicalDiagnosticBankItem[],overrides:readonly {itemKey:string;before:string;after:string}[],revision:number){
 const byKey=new Map(items.map((entry,index)=>[entry.itemKey,{entry,index}]));
 const next=[...items];
 for(const override of overrides){
  const match=byKey.get(override.itemKey);
  if(!match||match.entry.item.promptFr!==override.before)throw Error(`Revision ${revision} prompt override source mismatch: ${override.itemKey}`);
  next[match.index]={...match.entry,item:{...match.entry.item,promptFr:override.after}};
 }
 return next;
}

/** Assemble authoring sources, never publish or transfer approval to an edit.
 * The unchanged base entries retain their own provenance; every added entry is
 * required to remain pending. Source and mapping drift fail before any write. */
export function assembleDraftBank(base:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate,expansions:readonly DraftExpansion[],options:{revision?:number;verbFamilyRecognition?:boolean;etreParticipleAgreement?:boolean;questionDetailReading?:boolean;localDefinitionReading?:boolean;avoirParticipleAgreement?:boolean;causalReadingGenres?:boolean;causeRelationFamily?:boolean;passeRecentModalFamily?:boolean}={}){
 if(options.revision!==undefined&&(!Number.isSafeInteger(options.revision)||options.revision<1||base.bank.key!=="french-diagnostic-bank-v3"))throw Error("A bank revision needs a positive integer and the original French v3 base");
 if(options.verbFamilyRecognition&&(options.revision===undefined||options.revision<36))throw Error('Verb-family recognition requires bank revision 36 or later');
 if(options.etreParticipleAgreement&&(options.revision===undefined||options.revision<37||!options.verbFamilyRecognition))throw Error('Etre agreement requires bank revision 37 or later and verb-family recognition');
 if(options.causalReadingGenres&&(options.revision===undefined||options.revision<41||!options.avoirParticipleAgreement||!options.localDefinitionReading||!options.questionDetailReading||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Causal reading genres require bank revision 41 or later and preceding refinements");
 if(options.causeRelationFamily&&(options.revision===undefined||options.revision<42||!options.causalReadingGenres||!options.avoirParticipleAgreement||!options.localDefinitionReading||!options.questionDetailReading||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Cause relation family requires bank revision 42 or later and preceding refinements");
 if(options.passeRecentModalFamily&&(options.revision===undefined||options.revision<43||!options.causeRelationFamily||!options.causalReadingGenres||!options.avoirParticipleAgreement||!options.localDefinitionReading||!options.questionDetailReading||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Passe recent modal family requires bank revision 43 or later and preceding refinements");
 if(options.avoirParticipleAgreement&&(options.revision===undefined||options.revision<40||!options.localDefinitionReading||!options.questionDetailReading||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Avoir agreement requires bank revision 40 or later and preceding refinements");
 if(options.localDefinitionReading&&(options.revision===undefined||options.revision<39||!options.questionDetailReading||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Local-definition reading requires bank revision 39 or later and preceding refinements");
 if(options.questionDetailReading&&(options.revision===undefined||options.revision<38||!options.etreParticipleAgreement||!options.verbFamilyRecognition))throw Error("Question-detail reading requires bank revision 38 or later and preceding refinements");
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
 const revision44Items=options.revision!==undefined&&options.revision>=44?applyPromptOverrides(items,R44_LOCAL_GRAMMAR_PROMPT_OVERRIDES,44):items;
 const revisedItems=options.revision!==undefined&&options.revision>=45?applyPromptOverrides(revision44Items,R45_PLAIN_LANGUAGE_PROMPT_OVERRIDES,45):revision44Items;
 const bank:CanonicalDiagnosticBankArtifact={...base,items:revisedItems};delete bank.manifest;
 if(options.revision!==undefined)bank.bank={key:`french-diagnostic-bank-v3-r${options.revision}`,version:`${base.bank.version}-r${options.revision}`};
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length)throw Error(`Invalid assembled draft: ${validation.issues.join("; ")}`);
 if(validation.eligibleItemKeys.some(key=>!baseline.eligibleItemKeys.includes(key)))throw Error("Assembly promoted draft content");
 bank.manifest=validation.manifest;
 return {bank,annotations,sources,sourceBankChecksum:baseline.manifest.checksum};
}
