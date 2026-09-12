import {STUDENT_INTERFACE_COPY as copy} from "@/lib/student-interface-copy";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";

export function StudentAccessPending() {
  return <>
    <PageHeader title={copy.access.title} description={copy.access.description} />
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" /><span>{copy.access.help}</span></p>
        <p className="text-sm text-muted-foreground">{copy.access.resume}</p>
        <p className="text-sm"><Link href="/privacy" className="text-primary hover:underline">{copy.access.privacy}</Link></p>
      </CardContent>
    </Card>
  </>;
}
