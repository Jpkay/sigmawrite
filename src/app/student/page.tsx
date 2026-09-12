import StudentHome from './home-client';
import {HOME_COPY} from './home-copy';
import {journalCurrentStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';
export default async function StudentHomePage(){
 await journalCurrentStudentPayload('student:home-copy',HOME_COPY);
 return <StudentHome copy={HOME_COPY}/>;
}
