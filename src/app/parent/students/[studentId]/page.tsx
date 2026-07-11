import Link from "next/link";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { WeeklyReportView } from "@/components/weekly-report";
import { getStudentRow } from "@/lib/db/dashboard";
import { nowMs } from "@/lib/clock";
import { createClient } from "@/lib/supabase/server";
import { frontierForStudent } from "@/lib/diagnostic/live";
import { FrontierReportView } from "@/components/frontier-report";

export default async function ParentStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const child = await getStudentRow(studentId);

  if (!child) {
    return (
      <>
        <PageHeader title="Enfant introuvable" />
        <Link href="/parent" className={buttonVariants({ variant: "outline" })}>
          Retour
        </Link>
      </>
    );
  }
  const frontier = await frontierForStudent(studentId, await createClient());

  return (
    <>
      <PageHeader
        title={child.name}
        description="Rapport hebdomadaire — estimation basée sur l'usage de l'application."
      />
      <WeeklyReportView snap={child.snap} nowMs={nowMs()} />
      <h2 className="mb-3 mt-8 text-lg font-semibold">Frontière des compétences</h2>
      <p className="mb-4 text-sm text-muted-foreground">Preuves observées : ce que votre enfant peut faire, ce qui est en cours et les bases qui bloquent la suite.</p>
      <FrontierReportView data={frontier} audience="parent" />
    </>
  );
}
