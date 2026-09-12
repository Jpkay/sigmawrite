import StudentHome from './home-client';
import {HOME_COPY} from './home-copy';
import {journalStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';
import {requireRole} from '@/lib/auth';
import {getCurrentStudentId} from '@/lib/db/student';
import {createClient,isSupabaseConfigured} from '@/lib/supabase/server';
export default async function StudentHomePage(){
 if(!isSupabaseConfigured)return <StudentHome key="local" copy={HOME_COPY}/>;
 await requireRole(['student']);
 const owner=await getCurrentStudentId(await createClient());
 await journalStudentPayload(owner,'student:home-copy',HOME_COPY);
 // Changing accounts remounts all dashboard state, not just recommendations.
 return <StudentHome key={owner} copy={HOME_COPY}/>;
}
