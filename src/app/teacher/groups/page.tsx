import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getViewableStudents } from "@/lib/db/dashboard";
import { recommendedGroups } from "@/lib/reports";

export default async function GroupsPage() {
  const students = await getViewableStudents();
  const groups = recommendedGroups(students);

  return (
    <>
      <PageHeader
        title="Groupes d'intervention"
        description="Élèves regroupés par lacune de compétence partagée (PRD §N)."
      />
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune lacune partagée détectée pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.skillKey}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{g.label}</p>
                  <Badge variant="secondary">{g.studentNames.length} élève(s)</Badge>
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
