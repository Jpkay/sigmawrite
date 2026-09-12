import 'server-only';
import {createClient,createServiceClient,isSupabaseConfigured} from '@/lib/supabase/server';
import {requireRole} from '@/lib/auth';
import {getCurrentStudentId} from '@/lib/db/student';
import {SupabaseAssessmentStore} from './store';
import {journalMaterialDelivery} from './delivery-journal';
/** Call only with an owner established by the authenticated server boundary. */
export async function journalStudentPayload<T>(studentId:string,boundary:string,payload:T):Promise<T>{
 await journalMaterialDelivery(new SupabaseAssessmentStore(createServiceClient()),studentId,boundary,payload);
 return payload;
}
/** Server-rendered reference pages retain local skeleton behavior. Configured
 * deployments resolve ownership before journaling any delivered content. */
export async function journalCurrentStudentPayload(boundary:string,payload:unknown):Promise<void>{
 if(!isSupabaseConfigured)return;
 await requireRole(['student']);
 const studentId=await getCurrentStudentId(await createClient());
 await journalStudentPayload(studentId,boundary,payload);
}
