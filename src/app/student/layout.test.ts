import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),session:vi.fn(),access:vi.fn(),journal:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.role,getSessionProfile:f.session}));
vi.mock('@/lib/db/lifecycle',()=>({getStudentAccessGate:f.access}));
vi.mock('@/lib/supabase/server',()=>({isSupabaseConfigured:true}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('@/components/dashboard-shell',()=>({DashboardShell:()=>null}));
vi.mock('@/components/student-access-pending',()=>({StudentAccessPending:()=>null}));
vi.mock('@/components/student-assessment-gate',()=>({StudentAssessmentGate:()=>null}));
import Layout from './layout';
beforeEach(()=>{vi.resetAllMocks();f.role.mockResolvedValue({id:'profile',authUserId:'auth',displayName:'Élise',role:'student'});f.access.mockResolvedValue({authorized:true});f.journal.mockResolvedValue(undefined);});
it('records the exact shell labels and displayed identity before returning the shell',async()=>{
 const output=await Layout({children:'page content'});
 expect(f.role).toHaveBeenCalledWith(['student']);
 expect(f.journal).toHaveBeenCalledWith('student:shell',{area:'Élève',navigation:output.props.nav.map((n:{label:string})=>n.label),tabs:output.props.tabs.map((n:{label:string})=>n.label),displayName:'Élise',role:'student'});
 expect(JSON.stringify(f.journal.mock.calls)).not.toContain('page content');
 expect(output.props.user.name).toBe('Élise');
});
it('does not release an unjournaled shell when capture fails',async()=>{
 f.journal.mockRejectedValue(Error('capture unavailable'));
 await expect(Layout({children:null})).rejects.toThrow('capture unavailable');
});
it('never journals another identity after authorization fails',async()=>{
 f.role.mockRejectedValue(Error('not authorized'));
 await expect(Layout({children:null})).rejects.toThrow('not authorized');
 expect(f.journal).not.toHaveBeenCalled();
});
