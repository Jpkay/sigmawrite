import {createHash} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
/** Split UTF-8 bytes, not JS strings: a boundary may cross a multibyte character.
 * The database concatenates bytes before decoding and checks the whole payload. */
export function publicationUploadPayload(request:unknown){
 const bytes=Buffer.from(JSON.stringify(request),'utf8');
 if(!bytes.length||bytes.length>64*1024*1024)throw Error('Publication payload exceeds upload limit');
 const checksum='sha256:'+createHash('sha256').update(bytes).digest('hex');
 const chunks:string[]=[];
 for(let at=0;at<bytes.length;at+=262144)chunks.push(bytes.subarray(at,at+262144).toString('base64'));
 return {checksum,byteLength:bytes.length,chunks};
}
/** Caller retains this upload ID for retries. Chunks are immutable and idempotent.
 * This transport neither approves content nor skips the publication function. */
export async function uploadGranularPublication(db:SupabaseClient,uploadId:string,request:unknown){
 const payload=publicationUploadPayload(request);
 const begin=await db.rpc('begin_granular_publication_upload',{p_id:uploadId,p_checksum:payload.checksum,p_bytes:payload.byteLength,p_chunks:payload.chunks.length});
 if(begin.error)throw Error(begin.error.message);
 for(let position=0;position<payload.chunks.length;position++){
  const result=await db.rpc('append_granular_publication_chunk',{p_id:uploadId,p_position:position,p_base64:payload.chunks[position]});
  if(result.error)throw Error(`Publication chunk ${position}: ${result.error.message}`);
 }
 return {uploadId,checksum:payload.checksum,byteLength:payload.byteLength,chunks:payload.chunks.length};
}
