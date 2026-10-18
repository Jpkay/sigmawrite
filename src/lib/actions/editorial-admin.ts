"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** F.4 / H.15 switches and the admin dashboard of the editorial pipeline. */

export type EditorialDashboard = {
  settings: { liveEnabled: boolean; liveMode: "live" | "library_only"; autoSwitchReason: string | null; autoSwitchedAt: string | null };
  week: { liveChapters: number; fallbackChapters: number; fallbackRate: number; reports: number; meanRubric: number | null; meanCostUsd: number | null; p95LatencyMs: number | null };
  library: Array<{ kind: string; count: number }>;
  alerts: Array<{ id: string; kind: string; value: number; threshold: number; switched: boolean; createdAt: string }>;
  flaggedAudits: Array<{ id: string; contentId: string; reason: string; rubricMean: number | null; aiTells: number | null; createdAt: string }>;
};

export async function loadEditorialDashboard(): Promise<EditorialDashboard> {
  await requireRole(["platform_admin"]);
  const db = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const [settings, runs, fallbacks, reports, library, alerts, audits] = await Promise.all([
    db.from("editorial_settings").select("live_enabled,live_mode,auto_switch_reason,auto_switched_at").eq("id", true).maybeSingle(),
    db.from("editorial_runs").select("status,rubric_mean,cost_usd,latency_ms").eq("kind", "chapter").gte("created_at", weekAgo).limit(5000),
    db.from("story_chapters").select("id", { count: "exact", head: true }).eq("source", "fallback").gte("ready_at", weekAgo),
    db.from("editorial_text_reports").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("editorial_library_items").select("kind").eq("status", "published").limit(10000),
    db.from("editorial_alerts").select("id,kind,value,threshold,switched_to_library,created_at").order("created_at", { ascending: false }).limit(10),
    db.from("editorial_audits").select("id,content_id,reason,rubric_mean,ai_tells_score,created_at").eq("flagged", true).is("human_reviewed_at", null).order("created_at", { ascending: false }).limit(20),
  ]);
  const rows = runs.data ?? [];
  const published = rows.filter((r) => r.status === "published");
  const latencies = published.map((r) => Number(r.latency_ms ?? 0)).filter((n) => n > 0).sort((a, b) => a - b);
  const rubrics = published.map((r) => Number(r.rubric_mean)).filter((n) => Number.isFinite(n) && n > 0);
  const costs = rows.map((r) => Number(r.cost_usd ?? 0));
  const fallbackCount = fallbacks.count ?? 0;
  const counts = new Map<string, number>();
  for (const item of library.data ?? []) counts.set(item.kind as string, (counts.get(item.kind as string) ?? 0) + 1);
  return {
    settings: { liveEnabled: settings.data?.live_enabled !== false, liveMode: settings.data?.live_mode === "library_only" ? "library_only" : "live", autoSwitchReason: (settings.data?.auto_switch_reason as string | null) ?? null, autoSwitchedAt: (settings.data?.auto_switched_at as string | null) ?? null },
    week: {
      liveChapters: published.length, fallbackChapters: fallbackCount, fallbackRate: published.length + fallbackCount ? fallbackCount / (published.length + fallbackCount) : 0,
      reports: reports.count ?? 0, meanRubric: rubrics.length ? Number((rubrics.reduce((a, b) => a + b, 0) / rubrics.length).toFixed(2)) : null,
      meanCostUsd: costs.length ? Number((costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(4)) : null,
      p95LatencyMs: latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(0.95 * latencies.length))] : null,
    },
    library: [...counts.entries()].map(([kind, count]) => ({ kind, count })),
    alerts: (alerts.data ?? []).map((a) => ({ id: a.id as string, kind: a.kind as string, value: Number(a.value), threshold: Number(a.threshold), switched: Boolean(a.switched_to_library), createdAt: a.created_at as string })),
    flaggedAudits: (audits.data ?? []).map((a) => ({ id: a.id as string, contentId: a.content_id as string, reason: a.reason as string, rubricMean: a.rubric_mean === null ? null : Number(a.rubric_mean), aiTells: a.ai_tells_score === null ? null : Number(a.ai_tells_score), createdAt: a.created_at as string })),
  };
}

/** Global switch (platform admin). mode "live" also clears an automatic quality switch. */
export async function setEditorialLiveGeneration(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ enabled: z.boolean(), mode: z.enum(["live", "library_only"]) }).parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_editorial_live_generation", { p_enabled: data.enabled, p_mode: data.mode });
  if (error) throw new Error(error.message);
  await logAudit("admin.editorial_live_generation", { targetType: "editorial_settings", targetId: "global", metadata: data });
  revalidatePath("/admin/editorial");
  return data;
}

/** Weekly human reading of flagged audits (after publication, never blocking). */
export async function markAuditRead(input: unknown) {
  const session = await requireRole(["platform_admin"]);
  const data = z.object({ auditId: z.string().uuid(), notes: z.string().trim().max(2000).optional() }).parse(input);
  const { error } = await createServiceClient().from("editorial_audits").update({ human_reviewed_at: new Date().toISOString(), human_reviewer: session.id, human_notes: data.notes ?? null }).eq("id", data.auditId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/editorial");
  return { ok: true };
}

/** Per-class switch (teacher of the class, school admin or platform admin). */
export async function setClassLiveGeneration(input: unknown) {
  await requireRole(["teacher", "school_admin", "platform_admin"]);
  const data = z.object({ classId: z.string().uuid(), enabled: z.boolean() }).parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_class_live_generation", { p_class_id: data.classId, p_enabled: data.enabled });
  if (error) throw new Error(error.message);
  await logAudit("teacher.class_live_generation", { targetType: "class", targetId: data.classId, metadata: { enabled: data.enabled } });
  revalidatePath(`/teacher/classes/${data.classId}`);
  return { enabled: data.enabled };
}

export async function loadClassLiveGeneration(classId: string): Promise<boolean> {
  await requireRole(["teacher", "school_admin", "platform_admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("editorial_class_controls").select("live_enabled").eq("class_id", classId).maybeSingle();
  return data?.live_enabled !== false;
}
