import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { createClient } from "@/lib/supabase/server";
import { loadWordSession, type WordSession } from "@/lib/actions/words";
import { WORD_SESSION_COPY as copy } from "@/lib/vocabulary/session/copy";
import { WordSessionPlayer } from "./word-session-player";

const int = (value: string | string[] | undefined, fallback: number, max: number) => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, max) : fallback;
};

/**
 * One "Rappel éclair" burst (roadmap 2026-10 D.2). Opened from the daily plan
 * (`n` words to review, `nouveaux` words to introduce) or, optionally, from
 * the Vocabulaire page.
 */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["student"]);
  const owner = await getCurrentStudentId(await createClient());
  const params = await searchParams;
  const fromPlan = params.n !== undefined;
  let session: WordSession;
  try {
    session = await loadWordSession({ units: int(params.n, 6, 16), newWords: int(params.nouveaux, fromPlan ? 0 : 1, 6), offset: int(params.etape, 0, 20) });
  } catch (error) {
    return <p role="alert" className="mx-auto max-w-xl py-12 text-center text-sm text-muted-foreground">{error instanceof Error ? error.message : copy.error}</p>;
  }
  return <WordSessionPlayer key={`${owner}:${session.sessionId}`} session={session} backHref={fromPlan ? "/student" : "/student/vocabulary"} />;
}
