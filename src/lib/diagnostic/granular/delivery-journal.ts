import {checksum} from '@/lib/taxonomy/validate';
/** Exact string leaves from a JSON delivery, not guessed lemmas or sentence
 * boundaries. Numbers and booleans do not affect educational-text exposure.
 * This journal supports later coverage audits; recording it grants no novelty. */
export function deliveredTextFragments(payload:unknown):string[]{
 const seen=new Set<object>(),fragments=new Set<string>();let characters=0;
 function visit(value:unknown,depth:number){
  if(depth>40)throw Error('Material delivery exceeds journal depth');
  if(typeof value==='string'){
   // Transport URLs may carry temporary access tokens. They are not
   // linguistic source text or proof of the audio bytes behind them.
   if(!value.trim()||/^(?:https?:|data:|blob:)/i.test(value)||fragments.has(value))return;
   characters+=value.length;if(characters>2_000_000||fragments.size>=20_000)throw Error('Material delivery exceeds journal size');
   fragments.add(value);return;
  }
  if(value===null||value===undefined||typeof value==='boolean'||typeof value==='number')return;
  if(typeof value!=='object')throw Error('Material delivery is not JSON data');
  if(seen.has(value))throw Error('Cyclic material delivery');
  seen.add(value);
  if(Array.isArray(value))for(const child of value)visit(child,depth+1);
  else{
   if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw Error('Material delivery is not plain JSON data');
   for(const [key,child] of Object.entries(value))if(!/(?:url|href)$/i.test(key))visit(child,depth+1);
  }
  seen.delete(value);
 }
 visit(payload,0);return [...fragments].sort();
}
export type DeliveryJournalStore={recordDeliveredText?(input:{studentId:string;boundary:string;payloadChecksum:string;textFragments:string[]}):Promise<void>};
export async function journalMaterialDelivery(store:DeliveryJournalStore,studentId:string,boundary:string,payload:unknown){
 if(!store.recordDeliveredText)return;
 if(!/^[a-z][a-z0-9:_-]{1,99}$/.test(boundary))throw Error('Invalid material delivery boundary');
 const textFragments=deliveredTextFragments(payload);
 if(!textFragments.length)return;
 await store.recordDeliveredText({studentId,boundary,payloadChecksum:checksum(textFragments),textFragments});
}
