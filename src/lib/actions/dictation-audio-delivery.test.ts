import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({from:vi.fn(),journal:vi.fn(),sign:vi.fn(),manifest:null as unknown,guard:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from}),createServiceClient:()=>({from:f.from})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{},requireStudentLearningUnlocked:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/dictation/audio',()=>({signDictationAudio:f.sign}));
import {startDictation} from './student';
import {buildDictationAudioManifest,describeDictationAudio} from '@/lib/dictation/audio-manifest';
const id='11111111-1111-4111-8111-111111111111',text='Les chevaux arrivent.';
const speech={audio:new Uint8Array([1,2,3]),mimeType:'audio/mpeg',provider:'fixture',model:'fixture',voice:'fr'};
const input={dictationId:id,clientRequestId:'22222222-2222-4222-8222-222222222222'};
beforeEach(()=>{
 vi.clearAllMocks();f.manifest=buildDictationAudioManifest(id,(['segment','full'] as const).map(role=>describeDictationAudio({role,index:0,sourceText:text,speechPlan:[{kind:'text',text}],speed:.9,speech})),[text]);
 f.journal.mockImplementation(async(_owner,_boundary,payload)=>payload);f.sign.mockImplementation(async(_db,paths:string[])=>paths.map(p=>'https://audio.example/'+p));
 f.from.mockImplementation((table:string)=>{const q={select:()=>q,eq:()=>q,upsert:()=>q,order:()=>q,single:async()=>({data:{id:'attempt',submitted_at:null},error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve(resolve({data:table==='dictations'?[{id,key:'horses',title_fr:'Dictée',kind:'flash',text_fr:text,segments:[{text,audioPath:'old/segment.mp3'}],audio_status:'ready',audio_manifest:f.manifest}]:[],error:null}))};return q;});
});
it('records offered audio provenance server-side without exposing the answer text to the player',async()=>{
 const session=await startDictation(input);
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:dictation-audio-offered',f.manifest);
 expect(f.journal).toHaveBeenLastCalledWith('owner','legacy:dictation',session);
 expect(session.segments[0].browserText).toBeNull();expect(JSON.stringify(session)).not.toContain(text);
 expect(session.fullAudioUrl).toContain('/immutable/');
});
it('does not certify legacy audio with no manifest',async()=>{
 f.manifest=null;const session=await startDictation(input);
 expect(session.fullAudioUrl).toContain('horses/full.mp3');expect(f.journal).toHaveBeenCalledTimes(1);
});
it('withholds audio URLs when provenance cannot be recorded',async()=>{
 f.journal.mockRejectedValue(Error('journal unavailable'));
 await expect(startDictation(input)).rejects.toThrow('journal unavailable');
 expect(f.journal).toHaveBeenCalledTimes(1);
});
it('withholds incomplete signed audio without claiming delivery',async()=>{
 f.sign.mockResolvedValue([null,null]);await expect(startDictation(input)).rejects.toThrow('indisponible');expect(f.journal).not.toHaveBeenCalled();
});
it('rejects stale source records before signing or journaling',async()=>{
 const m=f.manifest as {dictationId:string};m.dictationId='33333333-3333-4333-8333-333333333333';
 await expect(startDictation(input)).rejects.toThrow('manifest changed');expect(f.sign).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
