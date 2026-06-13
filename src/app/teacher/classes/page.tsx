import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { getClassStudents, getTeacherClasses } from "@/lib/db/dashboard";

export default async function TeacherClassesPage() {
  const classes = await getTeacherClasses();
  const counts = await Promise.all(classes.map((c) => getClassStudents(c.id)));

  return (
    <>
      <PageHeader title="Mes classes" />
      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucune classe pour l&apos;instant.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((c, i) => (
            <Link key={c.id} href={`/teacher/classes/${c.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.grade_level ? `Niveau ${c.grade_level} · ` : ""}
                      {counts[i].length} élève(s)
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
