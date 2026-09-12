import LegacyProgress, {RecentReadingSessions} from './legacy-progress';
import {GranularFrontier} from '@/components/diagnostic/granular-frontier';
import {granularFrontierView} from '@/lib/diagnostic/granular/frontier-view';
import {SupabaseAssessmentStore} from '@/lib/diagnostic/granular/store';
import {sharedReleaseContentCache} from '@/lib/diagnostic/granular/release-content-cache';
import {requireRole} from '@/lib/auth';
import {createClient,createServiceClient} from '@/lib/supabase/server';
import {getCurrentStudentId} from '@/lib/db/student';
import {requireStudentAccessAuthorized} from '@/lib/diagnostic/access';
import {journalStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';

export default async function ProgressPage(){
 if(process.env.GRANULAR_DIAGNOSTIC_ENABLED!=='true')return <LegacyProgress/>;
 await requireRole(['student']);
 const client=await createClient(),studentId=await getCurrentStudentId(client);
 await requireStudentAccessAuthorized(client,studentId);
 const store=new SupabaseAssessmentStore(createServiceClient(),{cache:sharedReleaseContentCache,namespace:process.env.NEXT_PUBLIC_SUPABASE_URL!});
 const current=await store.latestSession(studentId);
 if(!current)return <LegacyProgress/>;
 const data=granularFrontierView(current.session,current.bundle);
 await journalStudentPayload(studentId,'student:granular-progress',data);
 return <><GranularFrontier data={data} title="Mes progrès"/><section className="mt-10"><RecentReadingSessions/></section></>;
}
