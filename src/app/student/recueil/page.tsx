import {recueilDisplay,RECUEIL_COPY as copy} from "@/lib/diagnostic/granular/recueil-display";
import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {StudentPageHeader as PageHeader} from "@/components/student-page-header";
import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { loadStudentRecueil } from "@/lib/actions/student";


/** Printable book of the trimester's final drafts (roadmap 5.6). */
export default async function Page() {
  const session = await requireRole(["student"]);
  const { since, entries } = await loadStudentRecueil({});
  const display=recueilDisplay(since,entries,session.displayName);
  await journalCurrentStudentPayload("student:recueil-display",display);
  return (
    <>
      <PageHeader boundary="student:recueil-header" eyebrow={copy.eyebrow} title={copy.title} description={display.description} actionText={copy.print} action={<PrintButton label={copy.print} />} />
      {entries.length === 0 ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : (
        <article className="mx-auto max-w-2xl print:max-w-none">
          <header className="mb-10 border-b border-border pb-6 text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">{copy.book}</p><h2 className="mt-2 font-display text-3xl font-semibold">{display.author}</h2><p className="mt-1 text-sm text-muted-foreground">{display.count}</p></header>
          <ol className="grid gap-10">
            {entries.map((entry, index) => (
              <li key={entry.id} className="break-inside-avoid">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{display.entries[index].kind}</p>
                <h3 className="mt-1 text-xl font-semibold">{entry.title}</h3>
                <p className="text-xs text-muted-foreground">{display.entries[index].date}</p>
                <p className="mt-3 whitespace-pre-line text-[17px] leading-8">{entry.text}</p>
              </li>
            ))}
          </ol>
        </article>
      )}
    </>
  );
}
