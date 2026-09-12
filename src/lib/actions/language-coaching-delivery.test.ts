import {beforeEach, expect, it, vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),access:vi.fn(),journal:vi.fn(),coach:vi.fn(),eq:vi.fn(),upsert:vi.fn(),owned:true,cache:null as Record<string,unknown>|null,service:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/linguistic/language-coach',()=>({coachReadingLanguage:f.coach}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>query(table,false)}),createServiceClient:()=>{f.service();return {from:(table:string)=>query(table,true),rpc:async()=>({data:4})};}}));
import {getPracticeLanguageCoaching} from './language-coaching';
const attemptId='11111111-1111-4111-8111-111111111111';
const result={tip:{kind:'grammar',before:'les cheval',after:'les chevaux',explanationFr:'Au pluriel, on écrit « chevaux ».',recurring:false},available:true};
function query(table:string,service:boolean){
 const attempt={id:attemptId,student_id:'owner',item_id:'item',is_correct:true,context:'practice',answer_text:'Les cheval quittent le village.',attempted_at:'2026-09-12T10:00:00Z'};
 const data=table==='competency_attempts'?(service?attempt:f.owned?{id:attemptId,student_id:'owner'}:null):table==='competency_items'?{prompt_fr:'Que font les animaux ?',validator_config:{readingRubric:{}}}:f.cache;
 const q:Record<string,unknown>={};for(const method of ['select','lt','not','order','limit'])q[method]=()=>q;
 q.eq=(...args:unknown[])=>{f.eq(service,table,...args);return q;};q.single=q.maybeSingle=async()=>({data});
 q.then=(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:table==='competency_attempts'?[]:data}).then(resolve);
 q.upsert=async(value:Record<string,unknown>)=>{f.upsert(value);f.cache={...f.cache,...value};return {error:null};};return q;
}
beforeEach(()=>{vi.resetAllMocks();f.owned=true;f.cache=null;f.coach.mockResolvedValue(result);});
it.each([true,false])('records generated requested=%s tips with the saved attempt and owner',async requested=>{
 expect(await getPracticeLanguageCoaching({attemptId,requested,studentId:'forged'})).toEqual(result);
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:practice-language-tip',{attemptId,...result});
 expect(f.eq).toHaveBeenCalledWith(false,'competency_attempts','student_id','owner');
 expect(f.eq).toHaveBeenCalledWith(true,'competency_attempts','student_id','owner');
});
it('records cached tips again at delivery without regenerating or grading',async()=>{
 f.cache={requested_result:result};expect(await getPracticeLanguageCoaching({attemptId,requested:true})).toEqual(result);
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:practice-language-tip',{attemptId,...result});expect(f.coach).not.toHaveBeenCalled();expect(f.upsert).not.toHaveBeenCalled();
});
it('withholds failed capture and retries from the saved coaching cache',async()=>{
 f.journal.mockRejectedValueOnce(Error('journal unavailable'));
 await expect(getPracticeLanguageCoaching({attemptId,requested:true})).rejects.toThrow('journal unavailable');
 expect(await getPracticeLanguageCoaching({attemptId,requested:true})).toEqual(result);
 expect(f.coach).toHaveBeenCalledTimes(1);
});
it('rejects another student attempt before a service read or coaching',async()=>{
 f.owned=false;await expect(getPracticeLanguageCoaching({attemptId,requested:true})).rejects.toThrow('Réponse introuvable');
 expect(f.service).not.toHaveBeenCalled();expect(f.coach).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
it('checks active access before resolving a tip',async()=>{
 f.access.mockRejectedValue(Error('inactive'));
 await expect(getPracticeLanguageCoaching({attemptId,requested:true})).rejects.toThrow('inactive');
 expect(f.eq).not.toHaveBeenCalled();expect(f.service).not.toHaveBeenCalled();
});
