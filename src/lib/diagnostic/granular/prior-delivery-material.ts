import {materialIdentity} from './material-identity';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import {questionMaterialKeys} from './material-annotations';
export type PriorDeliveryText={boundary:string;payloadChecksum:string;textFragments:string[]};
export type PriorDeliveryHistory={rows:PriorDeliveryText[];complete:boolean};
export type PriorMaterialMatch={materialKey:string;boundary:string;payloadChecksum:string};
const normalize=(text:string)=>text.normalize('NFC').toLocaleLowerCase('fr').replace(/[’‘]/g,"'").replace(/\s*'\s*/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?…]+$/g,'').trim();
/** Positive matches only: no guessed morphology and no claim that absence proves
 * novelty. Unknown variants still require an audited semantic capture contract. */
export function priorDeliveredMaterial(item:CanonicalDiagnosticBankItem['item'],history:readonly PriorDeliveryText[]):PriorMaterialMatch[]{
 const known=new Set(questionMaterialKeys(item));
 const raw=item.validatorConfig?.materialExposure as {words?:Array<{lemma:string;form:string}>;sentences?:string[];elidedGapAliases?:boolean}|undefined;
 if(!raw)return [];
 const variants=new Map<string,Set<string>>();
 const add=(key:string,form:string)=>{if(known.has(key)){const set=variants.get(key)??new Set<string>();set.add(normalize(form));variants.set(key,set);}};
 for(const word of raw.words??[]){const key=materialIdentity('word',word.lemma);add(key,word.form);add(key,word.lemma);}
 for(const sentence of raw.sentences??[]){
  add(materialIdentity('sentence',sentence),sentence);
  if(raw.elidedGapAliases){const alias=sentence.replace(/\b([Jj])[’'‘]\s*___/g,'$1e ___');add(materialIdentity('sentence',alias),alias);}
 }
 const letter=(char:string|undefined)=>char!==undefined&&/[\p{L}\p{N}_]/u.test(char);
 const contains=(source:string,target:string)=>{
  let index=source.indexOf(target);
  while(index!==-1){
   const before=Array.from(source.slice(0,index)).at(-1),after=Array.from(source.slice(index+target.length))[0];
   if(!letter(before)&&!letter(after))return true;
   index=source.indexOf(target,index+1);
  }
  return false;
 };
 const matches:PriorMaterialMatch[]=[];
 for(const row of history){
  const fragments=row.textFragments.map(normalize);
  for(const [key,forms] of variants)if([...forms].some(form=>fragments.some(fragment=>contains(fragment,form))))matches.push({materialKey:key,boundary:row.boundary,payloadChecksum:row.payloadChecksum});
 }
 return matches;
}
