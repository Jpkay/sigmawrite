import {expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
vi.mock('server-only',()=>({}));
import {SupabaseAssessmentStore} from './store';
function fixture(result:unknown){const rpc=vi.fn().mockResolvedValue(result);return {rpc,store:new SupabaseAssessmentStore({rpc} as unknown as SupabaseClient)};}
it('requires a database-owned proof for the same student and presentation',async()=>{
 const {store,rpc}=fixture({data:true,error:null});
 expect(await store.materialHistoryComplete('student','presentation')).toBe(true);
 expect(rpc).toHaveBeenCalledWith('student_material_history_complete',{p_student_id:'student',p_presentation_id:'presentation'});
});
it('keeps missing historical coverage and a pre-migration deployment unverified',async()=>{
 expect(await fixture({data:false,error:null}).store.materialHistoryComplete('s','p')).toBe(false);
 expect(await fixture({data:null,error:{code:'PGRST202',message:'missing function'}}).store.materialHistoryComplete('s','p')).toBe(false);
});
it('does not turn malformed responses or database failures into coverage proof',async()=>{
 for(const data of [null,'true',1,{}])await expect(fixture({data,error:null}).store.materialHistoryComplete('s','p')).rejects.toThrow('Invalid material coverage response');
 await expect(fixture({data:null,error:{code:'XX001',message:'database unavailable'}}).store.materialHistoryComplete('s','p')).rejects.toThrow('database unavailable');
});
it('records text with the authenticated owner and propagates journal storage failures',async()=>{
 const input={studentId:'s',boundary:'granular:diagnostic',payloadChecksum:'sha256:payload',textFragments:['Texte']};
 const {store,rpc}=fixture({data:null,error:null});await store.recordDeliveredText(input);
 expect(rpc).toHaveBeenCalledWith('record_student_material_delivery_text',{p_student_id:'s',p_boundary:'granular:diagnostic',p_payload_checksum:'sha256:payload',p_text_fragments:['Texte']});
 await expect(fixture({data:null,error:{message:'write failed'}}).store.recordDeliveredText(input)).rejects.toThrow('write failed');
});
it('reads prior text in bounded owner-scoped pages and keeps missing migration or truncated history incomplete',async()=>{
 const row={boundary:'legacy:reading-text',payload_checksum:'sha256:'+'a'.repeat(64),text_fragments:['Earlier text']};
 const {store,rpc}=fixture({data:[],error:null});
 rpc.mockResolvedValueOnce({data:Array.from({length:100},()=>row),error:null});
 expect(await store.loadPriorDeliveryText('owner','presentation')).toMatchObject({complete:true,rows:expect.any(Array)});
 expect(rpc).toHaveBeenNthCalledWith(2,'prior_student_material_delivery_text',{p_student_id:'owner',p_presentation_id:'presentation',p_offset:100,p_limit:100});
 expect(await fixture({data:null,error:{code:'PGRST202'}}).store.loadPriorDeliveryText('s','p')).toEqual({rows:[],complete:false});
 const large={...row,text_fragments:['x'.repeat(1_900_000)]};
 expect((await fixture({data:[large,large,large],error:null}).store.loadPriorDeliveryText('s','p')).complete).toBe(false);
 await expect(fixture({data:[{...row,text_fragments:[1]}],error:null}).store.loadPriorDeliveryText('s','p')).rejects.toThrow('Invalid prior delivery history');
});
it('sends covered presentations and text in one RPC and refuses a missing migration',async()=>{
 const input={studentId:'s',boundary:'granular:start',payloadChecksum:'sha256:payload',textFragments:['Les chevaux courent.'],presentations:[{presentationId:'p',sourceChecksum:'sha256:source',materialKeys:['word:cheval']}],contractKey:'audited-contract'};
 const {store,rpc}=fixture({data:null,error:null});
 await store.recordCoveredMaterialDelivery(input);
 expect(rpc).toHaveBeenCalledTimes(1);
 expect(rpc).toHaveBeenCalledWith('record_covered_student_material_delivery',{p_student_id:'s',p_boundary:input.boundary,p_payload_checksum:input.payloadChecksum,p_text_fragments:input.textFragments,p_presentations:input.presentations,p_contract_key:input.contractKey});
 await expect(fixture({data:null,error:{code:'PGRST202',message:'missing function'}}).store.recordCoveredMaterialDelivery(input)).rejects.toThrow('missing function');
});
