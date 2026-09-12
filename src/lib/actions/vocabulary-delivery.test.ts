import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),journal:vi.fn(),order:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/supabase/server',()=>({createServiceClient:vi.fn(),createClient:async()=>({from:(table:string)=>table==='students'?{select:()=>({eq:()=>({single:async()=>({data:{id:'owner'}})})})}:{select:()=>({eq:()=>({not:()=>({order:f.order})})})}})}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {loadVocabularyMemories} from './vocabulary';
import {vocabularyDisplay} from '@/lib/diagnostic/granular/vocabulary-display';
beforeEach(()=>{vi.resetAllMocks();f.role.mockResolvedValue({id:'profile'});f.order.mockResolvedValue({data:[{mastery:0,exposures:2,next_review_at:null,last_result:null,vocabulary_items:{id:'word',display_word:'rivage',definition_fr:'Bord de mer.',example_fr:null}}]});});
it('records correction wrappers and reachable counts before returning words',async()=>{
 const result=await loadVocabularyMemories();expect(Array.isArray(result)).toBe(true);
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:vocabulary',{rows:result,display:vocabularyDisplay(result)});
 expect(vocabularyDisplay(result).rows[0]).toEqual({exposures:'2 rencontre(s)',correction:'Réponse attendue : rivage'});
});
it('does not return vocabulary if recording fails',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));await expect(loadVocabularyMemories()).rejects.toThrow('capture failed');
});
