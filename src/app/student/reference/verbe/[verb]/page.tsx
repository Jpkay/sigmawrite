import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { buildConjugationTable, type ConjugationTable } from "@/lib/conjugation/table";
import { UnsupportedVerbError } from "@/lib/linguistic/conjugation";
import { VerbSearch } from "../verb-search";


/** Bescherelle-style tables from the deterministic engine; unsupported verbs fail closed (roadmap 3.1). */
export default async function Page({ params }: { params: Promise<{ verb: string }> }) {
  const { verb } = await params;
  const requested = decodeURIComponent(verb);
  let table: ConjugationTable | null = null;
  let failure = "";
  try { table = buildConjugationTable(requested); }
  catch (caught) { failure = caught instanceof UnsupportedVerbError ? "Ce verbe n’est pas encore dans le moteur. Plutôt qu’une table inventée, choisis un verbe proche ou demande-le à ton enseignant." : "Verbe introuvable."; }

  if (!table) {
    return (
      <>
        <PageHeader eyebrow="Référence" title={`« ${requested} »`} description={failure} />
        <VerbSearch initial={requested} />
        <Link href="/student/reference/verbe" className={`${buttonVariants({ variant: "outline" })} mt-6`}><ArrowLeft className="size-4" />Tous les verbes</Link>
      </>
    );
  }

  const modes = Array.from(new Set(table.tenses.map((tense) => tense.mode)));
  return (
    <>
      <PageHeader eyebrow={`Référence · ${table.group}${table.group === 1 ? "er" : "e"} groupe · auxiliaire ${table.auxiliary}`} title={table.infinitive} description={`Participe passé : ${table.participle}.`} action={<Link href="/student/reference/verbe" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" />Autre verbe</Link>} />
      <ul className="mb-8 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">{table.notes.map((note) => <li key={note} className="border-l-2 border-primary pl-3">{note}</li>)}</ul>
      {modes.map((mode) => (
        <section key={mode} className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold">{mode}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {table.tenses.filter((tense) => tense.mode === mode).map((tense) => (
              <article key={tense.tense} className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold">{tense.label}</h3>
                <p className="mb-3 text-xs text-muted-foreground">{tense.hint}</p>
                <table className="w-full text-[15px]">
                  <tbody>
                    {tense.rows.map((row) => <tr key={row.person} className="border-t border-border/60"><td className="py-1 pr-2 text-muted-foreground">{row.subject || "—"}</td><td className="py-1 font-medium">{row.form}</td></tr>)}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
