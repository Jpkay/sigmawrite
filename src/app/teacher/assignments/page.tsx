import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentForm } from "@/components/assignment-form";
import { getTeacherClasses } from "@/lib/db/dashboard";
import { getTeacherAssignments } from "@/lib/db/assignments";
import { SEED_TEXTS, SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { createClient } from "@/lib/supabase/server";
import { getAdultLanguage } from "@/lib/i18n";
import { loadAssignableDictations, loadDictationAssignmentResults } from "@/lib/actions/teacher";

export default async function TeacherAssignmentsPage() {
  const [classes, assignments, nodesResult, language, dictations] = await Promise.all([
    getTeacherClasses(),
    getTeacherAssignments(),
    (await createClient()).from("competency_nodes").select("id,label_fr").in("review_status", ["auto_approved","human_approved"]).order("label_fr"),
    getAdultLanguage(),
    loadAssignableDictations().catch(() => []),
  ]);const en=language==="en";
  const dictationResults = new Map(await Promise.all(assignments.filter((a) => a.target_type === "dictation").map(async (a) => [a.id, await loadDictationAssignmentResults(a.id).catch(() => null)] as const)));
  const classNames = new Map(classes.map((c) => [c.id, c.name]));
  const texts = SEED_TEXTS.map((t) => ({ slug: t.id, title: t.title }));

  return (
    <>
      <PageHeader
        title={en?"Assignments":"Devoirs"}
        description={en?"Assign reading or competency practice to a class.":"Assigner une lecture à une classe. Les élèves la voient dans leur file."}
      />

      <AssignmentForm language={language}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        texts={texts}
        nodes={(nodesResult.data ?? []).map((node) => ({ id: node.id as string, label: node.label_fr as string }))}
        dictations={dictations}
      />

      <h2 className="mb-3 text-lg font-semibold">{en?"Assigned work":"Devoirs assignés"}</h2>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{en?"No assignment yet.":<>Aucun devoir pour l&apos;instant.</>}</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {classNames.get(a.class_id) ?? (en?"Class":"Classe")} ·{" "}
                    {a.target_type === "text" && a.text_slug ? (SEED_TEXT_BY_ID[a.text_slug]?.title ?? a.text_slug) : a.target_type === "dictation" ? (en ? "Class dictée challenge" : "Défi dictée de classe") : (en?"Competency micro-session":"Micro-session de compétence")}
                    {a.due_at ? ` · ${en?"due":"échéance"} ${a.due_at}` : ""}
                  </p>
                </div>
                {a.target_type === "dictation" && dictationResults.get(a.id) ? (() => { const r = dictationResults.get(a.id)!; return <div className="text-right text-sm"><p className="font-display text-lg font-bold tabular-nums">{r.attempted} / {r.members}</p><p className="text-xs text-muted-foreground">{en ? "done" : "faite"}{r.averageScore != null ? ` · ${en ? "avg" : "moy."} ${r.averageScore}/10` : ""}{r.clean > 0 ? ` · ${r.clean} ${en ? "flawless" : "sans faute"}` : ""}</p></div>; })() : <Badge variant="secondary">{en?"Assigned":"Assigné"}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
