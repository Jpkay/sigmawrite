import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({configured:true,role:vi.fn(),owner:vi.fn(),ordinary:vi.fn(),covered:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/supabase/server',()=>({get isSupabaseConfigured(){return f.configured;},createClient:async()=>({}),createServiceClient:()=>({})}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('./store',()=>({SupabaseAssessmentStore:class{recordDeliveredText=f.ordinary;recordCoveredMaterialDelivery=f.covered;recordMaterialPresentation=async()=>{};}}));
import {journalCurrentStudentPayload} from './server-delivery-journal';
beforeEach(()=>{vi.resetAllMocks();f.configured=true;f.owner.mockResolvedValue('authenticated-owner');});
it('uses authenticated ownership for a covered interface-only delivery',async()=>{
 await journalCurrentStudentPayload('student:test',{text:'Bonjour'},'trusted-contract');
 expect(f.role).toHaveBeenCalledWith(['student']);
 expect(f.covered).toHaveBeenCalledWith(expect.objectContaining({studentId:'authenticated-owner',contractKey:'trusted-contract',textFragments:['Bonjour'],presentations:[]}));
 expect(f.ordinary).not.toHaveBeenCalled();
});
it('keeps ordinary capture as the default',async()=>{
 await journalCurrentStudentPayload('student:test',{text:'Bonjour'});
 expect(f.ordinary).toHaveBeenCalledWith(expect.objectContaining({studentId:'authenticated-owner',textFragments:['Bonjour']}));expect(f.covered).not.toHaveBeenCalled();
});
it('does not downgrade a covered write failure or bypass authorization',async()=>{
 f.covered.mockRejectedValueOnce(Error('atomic failure'));
 await expect(journalCurrentStudentPayload('student:test',{text:'Bonjour'},'trusted-contract')).rejects.toThrow('atomic failure');expect(f.ordinary).not.toHaveBeenCalled();
 f.covered.mockClear();f.role.mockRejectedValueOnce(Error('unauthorized'));
 await expect(journalCurrentStudentPayload('student:test',{text:'Bonjour'},'trusted-contract')).rejects.toThrow('unauthorized');expect(f.covered).not.toHaveBeenCalled();
});
it('cannot claim covered delivery in an unconfigured local skeleton',async()=>{
 f.configured=false;
 await journalCurrentStudentPayload('student:test',{text:'Bonjour'});
 await expect(journalCurrentStudentPayload('student:test',{text:'Bonjour'},'trusted-contract')).rejects.toThrow('configured backend');
 expect(f.covered).not.toHaveBeenCalled();expect(f.role).not.toHaveBeenCalled();
});
