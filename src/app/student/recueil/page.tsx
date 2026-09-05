import { PageHeader } from "@/components/page";
import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { loadStudentRecueil } from "@/lib/actions/student";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Printable book of the trimester's final drafts (roadmap 5.6). */
export default async function Page() {
  const session = await requireRole(["student"]);
  const { since, entries } = await loadStudentRecueil({});
  return (
    <>
      <PageHeader eyebrow="Mes écrits" title="Mon recueil" description={`Tes textes aboutis depuis le ${longDate(since)}. Imprime-le ou enregistre-le en PDF.`} action={<PrintButton label="Imprimer le recueil" />} />
      {entries.length === 0 ? <p className="text-sm text-muted-foreground">Pas encore de texte abouti ce trimestre. Une production réussie ou un résumé révisé apparaîtra ici.</p> : (
        <article className="mx-auto max-w-2xl print:max-w-none">
          <header className="mb-10 border-b border-border pb-6 text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Recueil</p><h2 className="mt-2 font-display text-3xl font-semibold">{session.displayName ?? "Élève"}</h2><p className="mt-1 text-sm text-muted-foreground">{entries.length} texte(s)</p></header>
          <ol className="grid gap-10">
            {entries.map((entry, index) => (
              <li key={entry.id} className="break-inside-avoid">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{index + 1} · {entry.kind === "production" ? "Production" : "Résumé"}</p>
                <h3 className="mt-1 text-xl font-semibold">{entry.title}</h3>
                <p className="text-xs text-muted-foreground">{longDate(entry.at)}{entry.note ? ` · ${entry.note}` : ""}</p>
                <p className="mt-3 whitespace-pre-line text-[17px] leading-8">{entry.text}</p>
              </li>
            ))}
          </ol>
        </article>
      )}
    </>
  );
}
