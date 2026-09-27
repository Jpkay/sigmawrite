import MemoryClient from './memory-client';
import {MEMORY_COPY} from '@/lib/diagnostic/granular/memory-display';
import {requireRole} from '@/lib/auth';
import {getCurrentStudentId} from '@/lib/db/student';
import {createClient,isSupabaseConfigured} from '@/lib/supabase/server';
import {journalStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';
export default async function Page(){
 if(!isSupabaseConfigured)return <MemoryClient key="local"/>;
 await requireRole(['student']);const owner=await getCurrentStudentId(await createClient());
 await journalStudentPayload(owner,'student:memory-copy',MEMORY_COPY);
 return <MemoryClient key={owner}/>;
}
