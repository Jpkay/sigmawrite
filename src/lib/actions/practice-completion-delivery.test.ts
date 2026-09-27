import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),journal:vi.fn(),rpc:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({}),createServiceClient:()=>({rpc:f.rpc})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{},requireStudentLearningUnlocked:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {completeNodePracticeSession} from './student';
import {practiceCompletionDisplay} from '@/lib/diagnostic/granular/practice-player-display';
const input={practiceSessionId:'11111111-1111-4111-8111-111111111111'};
const result={completed:true,expired:false,exercisesCompleted:5,plannedExercises:5,firstTryCorrect:4,baseXp:20,bonusXp:5,totalXp:25};
beforeEach(()=>{vi.resetAllMocks();f.rpc.mockResolvedValue({data:result,error:null});});
it('records exact completion wording before returning the saved result',async()=>{
 await expect(completeNodePracticeSession(input)).resolves.toEqual(result);
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:practice-completion',practiceCompletionDisplay(result));
});
it('withholds the response on capture failure without pretending the completed RPC rolled back',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));await expect(completeNodePracticeSession(input)).rejects.toThrow('capture failed');expect(f.rpc).toHaveBeenCalledTimes(1);
});
