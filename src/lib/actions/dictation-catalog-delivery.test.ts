import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),access:vi.fn(),from:vi.fn(),eq:vi.fn(),journal:vi.fn(),error:null as {message:string}|null}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from}),createServiceClient:()=>({from:f.from})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access,requireStudentLearningUnlocked:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {loadDictationCatalog} from './student';
const row={id:'dictation',key:'horses',title_fr:'Les chevaux dans le pré',kind:'flash',word_count:40,grade_min:6,grade_max:9,focus_fr:'Accorder les noms au pluriel',audio_status:'ready'};
beforeEach(()=>{
 vi.resetAllMocks();f.error=null;
 f.journal.mockImplementation(async(_owner,_boundary,payload)=>payload);
 f.from.mockImplementation((table:string)=>{const q={select:()=>q,eq:(...args:unknown[])=>{f.eq(...args);return q;},not:()=>q,order:()=>q,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:table==='dictations'?[row]:[],error:f.error}))};return q;});
});
it('records only the delivered catalog and scopes prior attempts to the authenticated owner',async()=>{
 const result=await loadDictationCatalog({});
 expect(f.eq).toHaveBeenCalledWith('student_id','owner');
 expect(result[0]).toMatchObject({title:row.title_fr,focus:row.focus_fr});
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:dictation-catalog',result);
 expect(result[0]).not.toHaveProperty('text_fr');
});
it('withholds the catalog after failed capture and permits retry',async()=>{
 f.journal.mockRejectedValueOnce(Error('journal unavailable'));
 await expect(loadDictationCatalog({})).rejects.toThrow('journal unavailable');
 expect((await loadDictationCatalog({}))[0].title).toBe(row.title_fr);
});
it('does not journal an unavailable catalog',async()=>{
 f.error={message:'read failed'};
 await expect(loadDictationCatalog({})).rejects.toThrow('read failed');
 expect(f.journal).not.toHaveBeenCalled();
});
it('rejects unauthorized access before fetching the catalog',async()=>{
 f.guard.mockRejectedValue(Error('unauthorized'));
 await expect(loadDictationCatalog({})).rejects.toThrow('unauthorized');
 expect(f.from).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
it('rejects client-supplied ownership',async()=>{
 await expect(loadDictationCatalog({studentId:'forged'})).rejects.toThrow('Données invalides');
 expect(f.journal).not.toHaveBeenCalled();
});
