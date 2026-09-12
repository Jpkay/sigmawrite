import type {SupabaseClient} from '@supabase/supabase-js';
import {type DictationAudioAsset,verifyDictationAudioBytes} from './audio-manifest';

/** Never overwrite a recorded audio object. A duplicate upload is accepted only
 * after verifying the bytes already stored at its content-addressed path. */
export async function storeImmutableDictationAudio(db:SupabaseClient,asset:DictationAudioAsset,bytes:Uint8Array):Promise<void>{
 verifyDictationAudioBytes(asset,bytes);
 const storage=db.storage.from('dictation-audio');
 const {error}=await storage.upload(asset.path,bytes,{contentType:asset.mimeType,upsert:false});
 if(!error)return;
 const status=String((error as {statusCode?:string|number}).statusCode??'');
 if(status!=='409'&&status!=='Duplicate'&&(error as {status?:number}).status!==409&&(error as {error?:string}).error!=='Duplicate')throw Error(`Dictation audio upload failed: ${error.message}`);
 const existing=await storage.download(asset.path);
 if(existing.error||!existing.data)throw Error('Cannot verify existing dictation audio');
 verifyDictationAudioBytes(asset,new Uint8Array(await existing.data.arrayBuffer()));
}
