import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAiTells } from "./ai-tells";
import { AUDIT_POLICY, evaluateAuditWindow, isSampled, type AuditAlert } from "./audit";
import { buildEditorialBrief } from "./brief";
import { CostMeter, type EditorialLLM } from "./llm";
import { auditorPrompt, styleReviewSchema } from "./prompts";
import { rubricMean } from "./rubric";
import { autoSwitchToLibrary } from "./store";
import { getStyleCard } from "./styles";
import { callRole, MemoryLogger } from "./team";
import { gradeBandFor, type GradeBand } from "./types";

/**
 * Daily audit job (roadmap H.15). Re-scores a 1–2% sample of yesterday's live
 * chapters plus every reported chapter with the stronger auditor model,
 * raises alerts and, on a quality alert, switches live generation to library
 * texts automatically. Never blocks or deletes a text; humans read the
 * flagged audits afterwards in /admin/editorial.
 */
export async function runDailyAudit(db: SupabaseClient, llm: EditorialLLM | null, now = new Date()): Promise<{ audited: number; alerts: AuditAlert[] }> {
  const day = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - 24 * 3600_000).toISOString();
  const { data: recent } = await db.from("story_chapters").select("id,saga_id,body_template,source").eq("status", "ready").eq("source", "live").gte("ready_at", since).limit(5000);
  const { data: reports } = await db.from("editorial_text_reports").select("id,content_id").eq("content_kind", "story_chapter").is("audited_at", null).limit(200);
  const reportedIds = new Set((reports ?? []).map((r) => r.content_id as string));
  const sampled = (recent ?? []).filter((c) => isSampled(c.id as string, day)).map((c) => c.id as string);
  const targets = [...new Set([...sampled, ...reportedIds])];
  let audited = 0;
  for (const chapterId of targets) {
    const { data: chapter } = await db.from("story_chapters").select("id,body_template,story_sagas!inner(style_key,grade_band,interest)").eq("id", chapterId).maybeSingle();
    if (!chapter?.body_template) continue;
    const saga = chapter.story_sagas as unknown as { style_key: string; grade_band: GradeBand; interest: string };
    const aiTells = checkAiTells(chapter.body_template as string);
    let rubric = null;
    let notes: string[] = [];
    let model: string | null = null;
    if (llm) {
      try {
        const brief = buildEditorialBrief({ kind: "chapter", mode: "live", interests: [saga.interest], grade: saga.grade_band === "cm" ? 5 : saga.grade_band === "6e-5e" ? 6 : saga.grade_band === "lycee" ? 10 : 8, gradeBand: saga.grade_band ?? gradeBandFor(6), targetTenses: ["present"], styleKey: saga.style_key });
        const { value, result } = await callRole({ llm, logger: new MemoryLogger(), meter: new CostMeter(0.5), gates: {} }, "auditor", auditorPrompt(brief, getStyleCard(saga.style_key), chapter.body_template as string), styleReviewSchema, 0.1);
        rubric = value.rubric;
        notes = value.notes;
        model = result.model;
      } catch { /* recorded as an audit without rubric */ }
    }
    const mean = rubric ? rubricMean(rubric) : null;
    await db.from("editorial_audits").insert({
      content_kind: "story_chapter", content_id: chapterId, reason: reportedIds.has(chapterId) ? "reported" : "sample", auditor_model: model,
      rubric, rubric_mean: mean, ai_tells_score: aiTells.score, flagged: (mean !== null && mean < 3.5) || aiTells.score >= 20 || reportedIds.has(chapterId), notes,
    });
    audited += 1;
  }
  if (reportedIds.size) await db.from("editorial_text_reports").update({ audited_at: now.toISOString() }).in("id", (reports ?? []).map((r) => r.id as string));

  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
  const [{ data: audits }, { count: published }, { count: fallbacks }, { count: reportCount }] = await Promise.all([
    db.from("editorial_audits").select("rubric_mean").eq("content_kind", "story_chapter").gte("created_at", weekAgo).not("rubric_mean", "is", null),
    db.from("story_chapters").select("id", { count: "exact", head: true }).eq("source", "live").gte("ready_at", weekAgo),
    db.from("story_chapters").select("id", { count: "exact", head: true }).eq("source", "fallback").gte("ready_at", weekAgo),
    db.from("editorial_text_reports").select("id", { count: "exact", head: true }).eq("content_kind", "story_chapter").gte("created_at", weekAgo),
  ]);
  const alerts = evaluateAuditWindow({ audited: (audits ?? []).map((a) => Number(a.rubric_mean)), publishedChapters: published ?? 0, reports: reportCount ?? 0, fallbacks: fallbacks ?? 0 }, AUDIT_POLICY);
  for (const alert of alerts) {
    await db.from("editorial_alerts").insert({ kind: alert.kind, value: alert.value, threshold: alert.threshold, switched_to_library: alert.switchToLibrary });
    if (alert.switchToLibrary) await autoSwitchToLibrary(db, `${alert.kind}:${alert.value}<>${alert.threshold}`);
  }
  return { audited, alerts };
}
