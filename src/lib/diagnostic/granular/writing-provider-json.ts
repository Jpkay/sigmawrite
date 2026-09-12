import {extractJson} from '@/lib/ai/item-generation/openai-compatible';
export const WRITING_JSON_ENVELOPE_POLICY='writing-json-envelope-v2';

/** A captured provider failure duplicates the object prefix before a
 * complete JSON object. Strip only that exact envelope; never repair values,
 * quotes inside the payload, truncated JSON or an incomplete grading object.
 * Whitespace between the duplicated opening brace and quote is also observed. */
export function parseWritingProviderJson(raw:string):unknown{
 try{return extractJson(raw);}catch(originalError){
  const text=raw.trim();
  const prefix=text.match(/^\{\s*"(?=\{)/)?.[0];
  if(!prefix)throw originalError;
  let value:unknown;
  try{value=JSON.parse(text.slice(prefix.length));}catch{throw originalError;}
  if(!value||typeof value!=='object'||Array.isArray(value)
   ||!['uncertain','connectedWriting','revisionReviewed','opportunities'].every(key=>Object.hasOwn(value,key)))throw originalError;
  return value;
 }
}
