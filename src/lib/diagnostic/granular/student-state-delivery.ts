import 'server-only';
import {homeFallbackDisplay} from './home-recommendation-display';
import {recentReadingDisplay} from './recent-reading-copy';
import {getStudentStateData} from '@/lib/db/student';
import {journalStudentPayload} from './server-delivery-journal';

/** Use at authenticated student delivery boundaries, including mutation replies.
 * Dashboard/report reads for adults must keep using the raw database reader:
 * those reads are not material delivered to the student. */
export async function getDeliveredStudentState(
  ...args: Parameters<typeof getStudentStateData>
): ReturnType<typeof getStudentStateData> {
  const state = await getStudentStateData(...args);
  await journalStudentPayload(args[0], 'legacy:student-state', {...state,recentReading:recentReadingDisplay(state.sessions),homeFallback:homeFallbackDisplay(state.interests)});
  return state;
}
