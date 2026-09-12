import 'server-only';
import {capturePreparedMaterialDelivery} from './covered-material-delivery';
import {createClient,createServiceClient,isSupabaseConfigured} from '@/lib/supabase/server';
import {requireRole} from '@/lib/auth';
import {getCurrentStudentId} from '@/lib/db/student';
import {SupabaseAssessmentStore} from './store';
import {journalMaterialDelivery} from './delivery-journal';
/** Call only with an owner established by the authenticated server boundary.
 * An optional capture key must be trusted server policy, never request input.
 * No production caller currently supplies one. */
export async function journalStudentPayload<T>(studentId:string,boundary:string,payload:T,captureContractKey?:string):Promise<T>{
 const store=new SupabaseAssessmentStore(createServiceClient());
 if(captureContractKey===undefined)await journalMaterialDelivery(store,studentId,boundary,payload);
 else await capturePreparedMaterialDelivery(store,studentId,boundary,payload,[],captureContractKey);
 return payload;
}
/** Server-rendered reference pages retain local skeleton behavior. Configured
 * deployments resolve ownership before journaling any delivered content. */
export async function journalCurrentStudentPayload(boundary:string,payload:unknown,captureContractKey?:string):Promise<void>{
 if(!isSupabaseConfigured){if(captureContractKey!==undefined)throw Error("Covered material delivery requires a configured backend");return;}
 await requireRole(['student']);
 const studentId=await getCurrentStudentId(await createClient());
 await journalStudentPayload(studentId,boundary,payload,captureContractKey);
}
