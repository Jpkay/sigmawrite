import {VERB_REFERENCE_COPY as copy} from "@/lib/diagnostic/granular/verb-reference-copy";
import { journalCurrentStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import Link from "next/link";
import {StudentPageHeader as PageHeader} from "@/components/student-page-header";
import { FREQUENT_VERBS } from "@/lib/conjugation/table";
import { VerbSearch } from "./verb-search";

export default async function Page() {
  await journalCurrentStudentPayload("reference:verb-index", { verbs: FREQUENT_VERBS,copy });
  return (
    <>
      <PageHeader boundary="reference:verb-index-header" eyebrow="Référence" title="Tables de conjugaison" description="Tous les temps d’un verbe, calculés par le même moteur qui corrige tes exercices." />
      <VerbSearch />
      <section className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{copy.frequent}</p>
        <ul className="flex flex-wrap gap-2">
          {FREQUENT_VERBS.map((verb) => <li key={verb}><Link href={`/student/reference/verbe/${encodeURIComponent(verb)}`} className="inline-block rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{verb}</Link></li>)}
        </ul>
      </section>
    </>
  );
}
