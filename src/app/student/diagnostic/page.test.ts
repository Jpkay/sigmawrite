import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),journal:vi.fn(),legacy:false,granular:false}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'student-owner'}));
vi.mock('@/lib/supabase/server',()=>{
 const db={from:(table:string)=>{const query={select:()=>query,eq:()=>query,limit:()=>query,maybeSingle:async()=>({data:(table==='diagnostic_runs'?f.legacy:f.granular)?{id:'existing'}:null,error:null})};return query;}};
 return {createClient:async()=>db,createServiceClient:()=>db};
});
vi.mock('./legacy-diagnostic',()=>({default:()=>null}));
vi.mock('@/components/diagnostic/granular-diagnostic',()=>({GranularDiagnostic:()=>null}));
import Page from './page';
import {DIAGNOSTIC_COPY} from '@/components/diagnostic/diagnostic-copy';
import {legacyDiagnosticFixedDisplay} from '@/lib/diagnostic/granular/legacy-diagnostic-display';
beforeEach(()=>{vi.resetAllMocks();f.legacy=false;f.granular=false;vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','true');});
it('records the granular fixed copy for the authenticated student before returning its client',async()=>{
 const page=await Page({searchParams:Promise.resolve({activity:'lesson'})});
 expect(f.journal).toHaveBeenCalledWith('student-owner','granular:ui-copy',DIAGNOSTIC_COPY);
 expect(page.props.initialActivityId).toBe('lesson');
});
it('records legacy client copy instead of granular copy for a retained legacy result',async()=>{
 f.legacy=true;await Page({searchParams:Promise.resolve({})});
 expect(f.journal).toHaveBeenCalledWith('student-owner','legacy:diagnostic-ui-copy',legacyDiagnosticFixedDisplay());
 expect(f.journal).not.toHaveBeenCalledWith('student-owner','granular:ui-copy',expect.anything());
});
it('records legacy client copy when granular diagnostic is disabled',async()=>{
 vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','false');
 await Page({searchParams:Promise.resolve({})});
 expect(f.journal).toHaveBeenCalledWith('student-owner','legacy:diagnostic-ui-copy',legacyDiagnosticFixedDisplay());
});
it('withholds the page on an authenticated journal failure',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));
 await expect(Page({searchParams:Promise.resolve({})})).rejects.toThrow('capture failed');
});
it('does not journal a student after authorization fails',async()=>{
 f.role.mockRejectedValue(Error('unauthorized'));
 await expect(Page({searchParams:Promise.resolve({})})).rejects.toThrow('unauthorized');
 expect(f.journal).not.toHaveBeenCalled();
});
