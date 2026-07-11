import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getViewableStudents } from "@/lib/db/dashboard";
import { recommendedGroups } from "@/lib/reports";
import { getAdultLanguage } from "@/lib/i18n";

export default async function GroupsPage() {
  const [students, language] = await Promise.all([getViewableStudents(), getAdultLanguage()]);
  const groups = recommendedGroups(students);

  return (
    <>
      <PageHeader
        title={language === "en" ? "Intervention groups" : "Groupes d’intervention"}
        description={language === "en" ? "Students grouped by a shared competency gap." : "Élèves regroupés par lacune de compétence partagée."}
      />
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {language === "en" ? "No shared gap detected yet." : "Aucune lacune partagée détectée pour l’instant."}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.skillKey}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{g.label}</p>
                  <Badge variant="secondary">{g.studentNames.length} {language === "en" ? "student(s)" : "élève(s)"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {g.studentNames.join(", ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
