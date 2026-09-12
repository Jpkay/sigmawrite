import {extractJson} from '@/lib/ai/item-generation/openai-compatible';
export const WRITING_JSON_ENVELOPE_POLICY='writing-json-envelope-v1';

/** A captured provider failure duplicates the two-byte object prefix before a
 * complete JSON object. Strip only that exact envelope; never repair values,
 * quotes inside the payload, truncated JSON or an incomplete grading object. */
export function parseWritingProviderJson(raw:string):unknown{
 try{return extractJson(raw);}catch(originalError){
  const text=raw.trim();
  if(!text.startsWith('{"{'))throw originalError;
  let value:unknown;
  try{value=JSON.parse(text.slice(2));}catch{throw originalError;}
  if(!value||typeof value!=='object'||Array.isArray(value)
   ||!['uncertain','connectedWriting','revisionReviewed','opportunities'].every(key=>Object.hasOwn(value,key)))throw originalError;
  return value;
 }
}
