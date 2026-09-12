import {PageHeader} from '@/components/page';
import {Card,CardContent} from '@/components/ui/card';
import {journalCurrentStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';
import {OFFLINE_COPY as copy} from './offline-copy';
export default async function OfflinePage(){
 await journalCurrentStudentPayload('student:offline-copy',copy);
 return <>
  <PageHeader title={copy.title} description={copy.description}/>
  <Card><CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
   <p>{copy.connectionRequired}</p><p>{copy.reconnect}</p>
  </CardContent></Card>
 </>;
}
