import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentForm } from "@/components/assignment-form";
import { getTeacherClasses } from "@/lib/db/dashboard";
import { getTeacherAssignments } from "@/lib/db/assignments";
import { SEED_TEXTS, SEED_TEXT_BY_ID } from "@/lib/content/texts";

export default async function TeacherAssignmentsPage() {
  const [classes, assignments] = await Promise.all([
    getTeacherClasses(),
    getTeacherAssignments(),
  ]);
  const classNames = new Map(classes.map((c) => [c.id, c.name]));
  const texts = SEED_TEXTS.map((t) => ({ slug: t.id, title: t.title }));

  return (
    <>
      <PageHeader
        title="Devoirs"
        description="Assigner une lecture à une classe. Les élèves la voient dans leur file."
      />

      <AssignmentForm
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        texts={texts}
      />

      <h2 className="mb-3 text-lg font-semibold">Devoirs assignés</h2>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun devoir pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {classNames.get(a.class_id) ?? "Classe"} ·{" "}
                    {SEED_TEXT_BY_ID[a.text_slug]?.title ?? a.text_slug}
                    {a.due_at ? ` · échéance ${a.due_at}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">Assigné</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
