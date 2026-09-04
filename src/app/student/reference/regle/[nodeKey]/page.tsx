import Link from "next/link";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { lessonForPracticeNode } from "@/lib/practice/lessons";

/** One rule card per competency: rule, pattern, examples, exceptions (roadmap 3.2). */
export default async function Page({ params }: { params: Promise<{ nodeKey: string }> }) {
  await requireRole(["student"]);
  const { nodeKey } = await params;
  const key = decodeURIComponent(nodeKey);
  const supabase = await createClient();
  const { data: node } = await supabase.from("competency_nodes").select("id,key,label_fr,description_fr,strand").eq("key", key).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!node) {
    return <><PageHeader eyebrow="Référence" title="Règle introuvable" description="Cette compétence n’est pas publiée." /><Link href="/student" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" />Accueil</Link></>;
  }
  const { data: approved } = await supabase.from("competency_lessons").select("explanation_fr,pattern_fr,examples_fr,exceptions_fr").eq("node_id", node.id as string).in("review_status", ["auto_approved", "human_approved"]).maybeSingle();
  const lesson = lessonForPracticeNode(
    { key: node.key as string, label: node.label_fr as string, description: node.description_fr as string | null, strand: node.strand as string },
    approved ? { explanation: approved.explanation_fr as string, pattern: approved.pattern_fr as string, examples: approved.examples_fr as string[], exceptions: approved.exceptions_fr as string[] } : undefined,
  );
  const isConjugation = node.strand === "conjugaison";
  return (
    <>
      <PageHeader eyebrow={`Référence · ${lesson.family}`} title={node.label_fr as string} description={node.description_fr as string | undefined} action={<Link href={`/student/practice/${node.id as string}`} className={buttonVariants()}><BookOpenCheck className="size-4" />S’entraîner</Link>} />
      <article className="max-w-3xl">
        <p className="text-lg leading-8">{lesson.explanation}</p>
        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">La règle en une ligne</p>
          <p className="mt-2 font-medium">{lesson.pattern}</p>
        </section>
        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Exemples</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{lesson.examples.map((example) => <p key={example} className="border-l-2 border-primary pl-3 text-sm leading-6">{example}</p>)}</div>
        </section>
        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Exceptions et pièges</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{lesson.exceptions.map((exception) => <li key={exception} className="flex gap-2"><span className="text-primary">•</span>{exception}</li>)}</ul>
        </section>
        {isConjugation && <p className="mt-8 text-sm">Besoin de la table complète ? <Link href="/student/reference/verbe" className="font-medium text-primary underline-offset-4 hover:underline">Ouvrir les tables de conjugaison</Link>.</p>}
      </article>
    </>
  );
}
