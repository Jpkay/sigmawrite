import {expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {describeDictationAudio} from './audio-manifest';
import {storeImmutableDictationAudio} from './immutable-audio-storage';
const bytes=new Uint8Array([1,2,3]);
const asset=describeDictationAudio({role:'full',index:0,sourceText:'Les chevaux arrivent.',speechPlan:[{kind:'text',text:'Les chevaux arrivent.'}],speed:.9,speech:{audio:bytes,mimeType:'audio/mpeg',provider:'fixture',model:'fixture',voice:'fr'}});
function fixture(){const upload=vi.fn().mockResolvedValue({error:null}),download=vi.fn().mockResolvedValue({data:new Blob([bytes]),error:null}),from=vi.fn().mockReturnValue({upload,download});return {db:{storage:{from}} as unknown as SupabaseClient,upload,download,from};}
it('writes the exact bytes without overwrite permission',async()=>{
 const f=fixture();await storeImmutableDictationAudio(f.db,asset,bytes);
 expect(f.from).toHaveBeenCalledWith('dictation-audio');
 expect(f.upload).toHaveBeenCalledWith(asset.path,bytes,{contentType:'audio/mpeg',upsert:false});expect(f.download).not.toHaveBeenCalled();
});
it.each([{statusCode:'409',message:'exists'},{status:409,statusCode:'Duplicate',message:'exists'}])('accepts a concurrent duplicate only after checking stored bytes (%j)',async error=>{
 const f=fixture();f.upload.mockResolvedValue({error});
 await storeImmutableDictationAudio(f.db,asset,bytes);expect(f.download).toHaveBeenCalledWith(asset.path);
 f.download.mockResolvedValue({data:new Blob([new Uint8Array([1,2,4])]),error:null});
 await expect(storeImmutableDictationAudio(f.db,asset,bytes)).rejects.toThrow('bytes changed');
 expect(f.upload.mock.calls.every(c=>c[2].upsert===false)).toBe(true);
});
it('does not mistake authentication or network failure for a duplicate',async()=>{
 const f=fixture();f.upload.mockResolvedValue({error:{statusCode:'403',message:'forbidden'}});
 await expect(storeImmutableDictationAudio(f.db,asset,bytes)).rejects.toThrow('upload failed');expect(f.download).not.toHaveBeenCalled();
});
it('fails if the existing object cannot be verified',async()=>{
 const f=fixture();f.upload.mockResolvedValue({error:{statusCode:'409',message:'exists'}});f.download.mockResolvedValue({error:{message:'unavailable'},data:null});
 await expect(storeImmutableDictationAudio(f.db,asset,bytes)).rejects.toThrow('Cannot verify');
});
it('rejects a mutable path or changed upload bytes before network access',async()=>{
 const f=fixture();await expect(storeImmutableDictationAudio(f.db,{...asset,path:'old/full.mp3'},bytes)).rejects.toThrow('not immutable');
 await expect(storeImmutableDictationAudio(f.db,asset,new Uint8Array([9,9,9]))).rejects.toThrow('bytes changed');expect(f.from).not.toHaveBeenCalled();
});
