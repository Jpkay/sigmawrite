import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSchoolTree } from "@/lib/db/admin";

export default async function AdminSchoolsPage() {
  const orgs = await getSchoolTree();

  return (
    <>
      <PageHeader
        title="Écoles"
        description="Organisations, écoles et classes (lecture seule)."
      />
      {orgs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune organisation.</p>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <Card key={org.id}>
              <CardContent className="pt-6">
                <p className="font-semibold">{org.name}</p>
                {org.schools.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Aucune école.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {org.schools.map((school) => (
                      <div key={school.id} className="rounded-md border border-border p-3">
                        <p className="text-sm font-medium">
                          {school.name}
                          {school.city ? (
                            <span className="text-muted-foreground"> · {school.city}</span>
                          ) : null}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {school.classes.map((c) => (
                            <Badge key={c.id} variant="secondary">
                              {c.name}
                              {c.grade_level ? ` · niveau ${c.grade_level}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
