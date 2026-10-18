import type { SupabaseClient } from "@supabase/supabase-js";
import { getStyleCard } from "@/lib/content/editorial/styles";
import { interestPhrase } from "@/lib/content/interests";
import { mannerOf } from "./copy";

/** Title shown for a saga, also when the outline (and its title) is missing. */
export function sagaTitle(saga: { title: string | null; interest: string }): string {
  return saga.title?.trim() || `Une aventure autour de ${interestPhrase(saga.interest)}`;
}

export function styleName(key: string): string {
  try { return getStyleCard(key).studentFacingName; } catch { return "un auteur"; }
}

/** Recueil entries for endings written this term (H.4). Reads through the student's own client (RLS). */
export async function loadRecueilEndings(db: SupabaseClient, studentId: string, since: string): Promise<Array<{ id: string; at: string; title: string; text: string; note: string | null }>> {
  const { data } = await db.from("story_endings").select("id,saga_id,body,style_key,style_challenge,created_at,story_sagas(title,interest)").eq("student_id", studentId).gte("created_at", since).order("created_at", { ascending: true });
  return (data ?? []).map((row) => {
    const saga = row.story_sagas as unknown as { title: string | null; interest: string } | null;
    const manner = mannerOf(styleName(row.style_key as string));
    return {
      id: row.id as string, at: row.created_at as string,
      title: `Ma fin pour « ${sagaTitle({ title: saga?.title ?? null, interest: saga?.interest ?? "" })} »`,
      text: row.body as string,
      note: row.style_challenge ? `Fin alternative · écrite ${manner}` : "Fin alternative",
    };
  });
}
