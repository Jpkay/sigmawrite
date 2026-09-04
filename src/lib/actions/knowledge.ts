"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { packetClaimSchema, packetVocabularySchema } from "@/lib/content/knowledge-packets";

const uuid = z.string().uuid();
const draftSchema = z.object({
  conceptId: uuid,
  explanationFr: z.string().trim().min(10).max(5000),
  claims: z.array(packetClaimSchema).max(100),
  misconceptions: z.array(z.string().trim().min(1).max(1200)).max(50),
  examples: z.array(z.string().trim().min(1).max(1200)).max(50),
  vocabulary: z.array(packetVocabularySchema).max(100),
  reviewAfter: z.string().datetime({ offset: true }).nullable(),
  generationProvenance: z.record(z.string(), z.unknown()).default({}),
});
const sourceSchema = z.object({
  packetId: uuid,
  sourceUri: z.string().url().max(2000),
  title: z.string().trim().min(1).max(500),
  publisher: z.string().trim().min(1).max(300),
  relationship: z.enum(["grounded_by", "validated_by", "updated_from"]),
  isPrimary: z.boolean(),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  accessedAt: z.string().datetime({ offset: true }),
  contentChecksum: z.string().trim().max(300).nullable(),
});

export async function createKnowledgePacketDraft(input: unknown) {
  const actor = await requireRole(["platform_admin"]);
  const data = draftSchema.parse(input);
  const db = await createClient();
  const { data: concept, error: conceptError } = await db.from("knowledge_concepts")
    .select("id,risk_class,source_requirement")
    .eq("id", data.conceptId)
    .single();
  if (conceptError || !concept) throw new Error(conceptError?.message ?? "Concept introuvable.");
  const { data: latest, error: latestError } = await db.from("knowledge_concept_packets")
    .select("version")
    .eq("concept_id", data.conceptId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);
  const { data: packet, error } = await db.from("knowledge_concept_packets").insert({
    concept_id: data.conceptId,
    version: Number(latest?.version ?? 0) + 1,
    status: "draft",
    explanation_fr: data.explanationFr,
    claims: data.claims,
    misconceptions: data.misconceptions,
    examples: data.examples,
    vocabulary: data.vocabulary,
    risk_class: concept.risk_class,
    source_requirement: concept.source_requirement,
    generation_provenance: data.generationProvenance,
    review_after: data.reviewAfter ?? (concept.source_requirement === "none"
      ? null
      : new Date(Date.now() + 30 * 86_400_000).toISOString()),
  }).select("id,version").single();
  if (error || !packet) throw new Error(error?.message ?? "Paquet non créé.");
  await logAudit("knowledge.packet_draft_created", {
    targetType: "knowledge_concept_packet",
    targetId: packet.id as string,
    metadata: { conceptId: data.conceptId, version: packet.version, actorId: actor.id },
  });
  return { id: packet.id as string, version: Number(packet.version) };
}

export async function addKnowledgePacketSource(input: unknown) {
  const actor = await requireRole(["platform_admin"]);
  const data = sourceSchema.parse(input);
  const db = await createClient();
  const { data: packet, error: packetError } = await db.from("knowledge_concept_packets")
    .select("id,status")
    .eq("id", data.packetId)
    .single();
  if (packetError || !packet) throw new Error(packetError?.message ?? "Paquet introuvable.");
  if (packet.status !== "draft") throw new Error("Seul un paquet brouillon peut recevoir une source.");
  const { data: source, error } = await db.from("knowledge_packet_sources").insert({
    packet_id: data.packetId,
    source_uri: data.sourceUri,
    title: data.title,
    publisher: data.publisher,
    relationship: data.relationship,
    is_primary: data.isPrimary,
    published_at: data.publishedAt,
    accessed_at: data.accessedAt,
    content_checksum: data.contentChecksum,
  }).select("id").single();
  if (error || !source) throw new Error(error?.message ?? "Source non ajoutée.");
  await logAudit("knowledge.packet_source_added", {
    targetType: "knowledge_concept_packet",
    targetId: data.packetId,
    metadata: { sourceId: source.id, actorId: actor.id },
  });
  return { id: source.id as string };
}

export async function approveKnowledgePacket(input: unknown) {
  const actor = await requireRole(["platform_admin"]);
  const packetId = uuid.parse(input);
  const db = await createClient();
  const { data: packet, error: packetError } = await db.from("knowledge_concept_packets")
    .select("id,concept_id,status")
    .eq("id", packetId)
    .single();
  if (packetError || !packet) throw new Error(packetError?.message ?? "Paquet introuvable.");
  if (packet.status !== "draft") throw new Error("Seul un brouillon peut être approuvé.");
  const { data: existing } = await db.from("knowledge_concept_packets")
    .select("id")
    .eq("concept_id", packet.concept_id)
    .eq("status", "human_approved")
    .neq("id", packetId)
    .maybeSingle();
  if (existing) throw new Error("Retire d’abord la version approuvée actuelle.");
  const { error } = await db.from("knowledge_concept_packets").update({
    status: "human_approved",
    reviewed_by: actor.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", packetId).eq("status", "draft");
  if (error) throw new Error(error.message);
  await logAudit("knowledge.packet_approved", {
    targetType: "knowledge_concept_packet",
    targetId: packetId,
    metadata: { actorId: actor.id },
  });
  return { ok: true };
}

export async function retireKnowledgePacket(input: unknown) {
  const actor = await requireRole(["platform_admin"]);
  const packetId = uuid.parse(input);
  const db = await createClient();
  const { error } = await db.from("knowledge_concept_packets")
    .update({ status: "retired" })
    .eq("id", packetId)
    .eq("status", "human_approved");
  if (error) throw new Error(error.message);
  await logAudit("knowledge.packet_retired", {
    targetType: "knowledge_concept_packet",
    targetId: packetId,
    metadata: { actorId: actor.id },
  });
  return { ok: true };
}
