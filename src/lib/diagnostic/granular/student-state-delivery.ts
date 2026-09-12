import 'server-only';
import {getStudentStateData} from '@/lib/db/student';
import {journalStudentPayload} from './server-delivery-journal';

/** Use at authenticated student delivery boundaries, including mutation replies.
 * Dashboard/report reads for adults must keep using the raw database reader:
 * those reads are not material delivered to the student. */
export async function getDeliveredStudentState(
  ...args: Parameters<typeof getStudentStateData>
): ReturnType<typeof getStudentStateData> {
  const state = await getStudentStateData(...args);
  return journalStudentPayload(args[0], 'legacy:student-state', state);
}
