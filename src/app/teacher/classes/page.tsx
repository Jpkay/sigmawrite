import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { getClassStudents, getTeacherClasses } from "@/lib/db/dashboard";
import { ClassCreateForm } from "@/components/class-create-form";
import { getAdultLanguage } from "@/lib/i18n";

export default async function TeacherClassesPage() {
  const [classes, language] = await Promise.all([getTeacherClasses(), getAdultLanguage()]);
  const counts = await Promise.all(classes.map((c) => getClassStudents(c.id)));

  return (
    <>
      <PageHeader title={language === "en" ? "My classes" : "Mes classes"} />
      <ClassCreateForm language={language} />
      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {language === "en" ? "No class yet." : "Aucune classe pour l’instant."}
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
                      {c.grade_level ? `${language === "en" ? "Grade" : "Niveau"} ${c.grade_level} · ` : ""}
                      {counts[i].length} {language === "en" ? "student(s)" : "élève(s)"}
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
