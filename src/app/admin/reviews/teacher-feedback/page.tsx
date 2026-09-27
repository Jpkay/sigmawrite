import Link from "next/link";
import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { AssessmentBundle } from "@/lib/diagnostic/granular/service";
import { ReviewAdminNav } from "../review-nav";

export default async function TeacherFeedbackPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["platform_admin"]);
  const query = await searchParams;
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 50;
  const db = await createClient();
  const { data, count, error } = await db.from("teacher_content_feedback")
    .select("id,teacher_profile_id,content_kind,content_id,release_id,content_key,comment,created_at", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);
  const feedback = data ?? [];
  const ids = (kind: string) => [...new Set(feedback.filter((row) => row.content_kind === kind).map((row) => row.content_id as string))];
  const teacherIds = [...new Set(feedback.map((row) => row.teacher_profile_id as string))];
  const releaseIds = [...new Set(feedback.flatMap((row) => row.release_id ? [row.release_id as string] : []))];
  const [teachers, lessons, passages, exercises, releases] = await Promise.all([
    teacherIds.length ? db.from("profiles").select("id,display_name").in("id", teacherIds) : Promise.resolve({ data: [], error: null }),
    ids("lesson").length ? db.from("competency_lessons").select("id,competency_nodes(label_fr)").in("id", ids("lesson")) : Promise.resolve({ data: [], error: null }),
    ids("passage").length ? db.from("text_versions").select("id,title").in("id", ids("passage")) : Promise.resolve({ data: [], error: null }),
    ids("exercise").length ? db.from("competency_items").select("id,prompt_fr").in("id", ids("exercise")) : Promise.resolve({ data: [], error: null }),
    releaseIds.length ? createServiceClient().from("granular_assessment_releases").select("id,release_key,bundle").in("id", releaseIds) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [teachers, lessons, passages, exercises, releases]) if (result.error) throw new Error(result.error.message);
  const names = new Map((teachers.data ?? []).map((row) => [row.id as string, row.display_name as string | null]));
  const titles = new Map<string, string>();
  for (const row of lessons.data ?? []) titles.set(`lesson:${row.id}`, (row.competency_nodes as unknown as { label_fr: string } | null)?.label_fr ?? "Leçon retirée");
  for (const row of passages.data ?? []) titles.set(`passage:${row.id}`, row.title as string);
  for (const row of exercises.data ?? []) titles.set(`exercise:${row.id}`, row.prompt_fr as string);
  for (const row of releases.data ?? []) {
    const bundle = row.bundle as AssessmentBundle;
    for (const lesson of bundle.teachingContent ?? []) titles.set(`granular_lesson:${row.id}:${lesson.id}`, `${lesson.titleFr} · ${row.release_key}`);
    for (const exercise of bundle.bank.items) titles.set(`granular_exercise:${row.id}:${exercise.itemKey}`, `${exercise.item.promptFr} · ${row.release_key}`);
  }
  const kindLabels: Record<string, string> = { lesson: "Leçon", passage: "Texte revu", exercise: "Exercice", granular_lesson: "Leçon du diagnostic", granular_exercise: "Exercice du diagnostic" };

  return <>
    <PageHeader eyebrow="Qualité pédagogique" title="Observations enseignantes" description="Commentaires transmis sur les contenus disponibles dans l’espace enseignant." />
    <ReviewAdminNav />
    <p className="mb-5 text-sm text-muted-foreground">{count ?? 0} observation{count === 1 ? "" : "s"} reçue{count === 1 ? "" : "s"}</p>
    {feedback.length ? <div className="divide-y divide-border border-y border-border">{feedback.map((row) => <article key={row.id} className="py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{kindLabels[row.content_kind as string] ?? "Contenu"}</p>
      <h2 className="mt-1 font-medium">{titles.get(row.release_id ? `${row.content_kind}:${row.release_id}:${row.content_key}` : `${row.content_kind}:${row.content_id}`) ?? "Contenu retiré"}</h2>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{row.release_id ? `${row.release_id} · ${row.content_key}` : row.content_id}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.comment}</p>
      <p className="mt-3 text-xs text-muted-foreground">{names.get(row.teacher_profile_id as string) ?? "Enseignant"} · {new Date(row.created_at as string).toLocaleDateString("fr-FR")}</p>
    </article>)}</div> : <p className="border-y border-border py-8 text-sm text-muted-foreground">Aucune observation reçue.</p>}
    <nav aria-label="Pages des observations" className="mt-6 flex justify-between text-sm">
      {page > 1 ? <Link href={`/admin/reviews/teacher-feedback?page=${page - 1}`} className="text-primary">Précédent</Link> : <span />}
      <span>Page {page}</span>
      {page * pageSize < (count ?? 0) ? <Link href={`/admin/reviews/teacher-feedback?page=${page + 1}`} className="text-primary">Suivant</Link> : <span />}
    </nav>
  </>;
}
