import {requireRole} from '@/lib/auth';
import {DiagnosticTestWorkspace} from './workspace';

export default async function DiagnosticTestPage(){
 await requireRole(['platform_admin']);
 return <DiagnosticTestWorkspace/>;
}
