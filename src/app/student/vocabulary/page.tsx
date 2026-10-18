import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { createClient } from "@/lib/supabase/server";
import { StudentPageHeader as PageHeader } from "@/components/student-page-header";
import { buttonVariants } from "@/components/ui/button";
import { loadWordTreasure } from "@/lib/actions/words";
import { WORD_SESSION_COPY as copy } from "@/lib/vocabulary/session/copy";
import { WordTreasure } from "./word-treasure";

/**
 * Optional page (roadmap 2026-10 D.7): word reviews live in the daily
 * session; here the student can do an extra "Rappel éclair" and browse
 * "Mon trésor de mots".
 */
export default async function Page() {
  await requireRole(["student"]);
  const owner = await getCurrentStudentId(await createClient());
  const groups = await loadWordTreasure();
  return <>
    <PageHeader boundary="student:vocabulary-header" title={copy.treasure} description={copy.treasureHelp} />
    <section className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
      <div className="flex items-start gap-3">
        <Zap className="mt-0.5 size-5 shrink-0 text-primary" />
        <div><p className="font-semibold">{copy.title}</p><p className="text-sm text-muted-foreground">{copy.optional}</p></div>
      </div>
      <Link href="/student/vocabulary/rappel" className={buttonVariants({ variant: "outline" })}>{copy.start} <ArrowRight /></Link>
    </section>
    <WordTreasure key={owner} groups={groups} />
  </>;
}
