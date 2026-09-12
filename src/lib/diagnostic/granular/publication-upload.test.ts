import {expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {publicationUploadPayload,uploadGranularPublication} from './publication-upload';
it('preserves accented French and emoji across binary chunk boundaries',()=>{
 const request={text:'é🐈'.repeat(70000)},payload=publicationUploadPayload(request);
 expect(payload.chunks.length).toBeGreaterThan(1);
 expect(JSON.parse(Buffer.concat(payload.chunks.map(chunk=>Buffer.from(chunk,'base64'))).toString('utf8'))).toEqual(request);
 for(const chunk of payload.chunks)expect(Buffer.from(chunk,'base64').length).toBeLessThanOrEqual(262144);
 expect(publicationUploadPayload(request)).toEqual(payload);
 expect(publicationUploadPayload({...request,text:request.text+'x'}).checksum).not.toBe(payload.checksum);
});
it('resumes with the same identity and stops on a rejected chunk without publishing',async()=>{
 const rpc=vi.fn().mockResolvedValueOnce({error:null}).mockResolvedValueOnce({error:{message:'conflict'}});
 await expect(uploadGranularPublication({rpc} as unknown as SupabaseClient,'same-upload',{text:'test'})).rejects.toThrow('Publication chunk 0: conflict');
 expect(rpc.mock.calls.map(call=>call[0])).toEqual(['begin_granular_publication_upload','append_granular_publication_chunk']);
});
it('uploads only ordered bounded chunks and leaves activation to the locked publisher',async()=>{
 const rpc=vi.fn().mockResolvedValue({error:null}),request={text:'a'.repeat(300000)};
 const result=await uploadGranularPublication({rpc} as unknown as SupabaseClient,'same-upload',request);
 expect(result.chunks).toBe(2);
 expect(rpc.mock.calls.slice(1).map(call=>call[1].p_position)).toEqual([0,1]);
 expect(rpc.mock.calls.every(call=>!call[0].startsWith('finish'))).toBe(true);
});
