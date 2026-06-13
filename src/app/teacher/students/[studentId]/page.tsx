import Link from "next/link";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { WeeklyReportView } from "@/components/weekly-report";
import { getStudentRow } from "@/lib/db/dashboard";
import { nowMs } from "@/lib/clock";

export default async function TeacherStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudentRow(studentId);

  if (!student) {
    return (
      <>
        <PageHeader title="Élève introuvable" />
        <Link href="/teacher" className={buttonVariants({ variant: "outline" })}>
          Retour
        </Link>
      </>
    );
  }

  return (
    <>
      <PageHeader title={student.name} description="Preuves de lecture et compétences." />
      <WeeklyReportView snap={student.snap} nowMs={nowMs()} />
    </>
  );
}
