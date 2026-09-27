import 'server-only';
import {createClient} from '@/lib/supabase/server';
import {journalStudentPayload} from './server-delivery-journal';
import {ASSIGNMENT_COPY,assignmentDisplay,type Assignment} from './assignment-display';

/** The caller resolves the owner from auth; the session client enforces assignment RLS. */
export async function deliveredStudentAssignments(owner:string,client:Awaited<ReturnType<typeof createClient>>):Promise<Assignment[]>{
 const {data,error}=await client.from('assignments').select('id, text_slug, target_type, target_node_id, target_dictation_id, title, instructions, due_at').order('due_at',{ascending:true,nullsFirst:false});
 if(error)throw error;
 const assignments=(data??[]) as Assignment[];
 await journalStudentPayload(owner,'student:assignments',{copy:ASSIGNMENT_COPY,assignments,display:assignments.map(assignmentDisplay)});
 return assignments;
}
