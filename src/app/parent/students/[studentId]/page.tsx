import Link from "next/link";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { WeeklyReportView } from "@/components/weekly-report";
import { getStudentRow } from "@/lib/db/dashboard";
import { nowMs } from "@/lib/clock";

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

  return (
    <>
      <PageHeader
        title={child.name}
        description="Rapport hebdomadaire — estimation basée sur l'usage de l'application."
      />
      <WeeklyReportView snap={child.snap} nowMs={nowMs()} />
    </>
  );
}
