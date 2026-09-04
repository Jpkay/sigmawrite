import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generationGroundingPacketSchema,
  type GenerationGroundingPacket,
} from "@/lib/content/knowledge-packets";

type PacketRow = {
  packet_id: string;
  concept_id: string;
  concept_key: string;
  label_fr: string;
  risk_class: GenerationGroundingPacket["riskClass"];
  source_requirement: GenerationGroundingPacket["sourceRequirement"];
  explanation_fr: string;
  claims: unknown;
  misconceptions: unknown;
  examples: unknown;
  vocabulary: unknown;
  reviewed_at: string;
  review_after: string | null;
  sources: unknown;
};

function packetFromRow(row: PacketRow): GenerationGroundingPacket {
  return generationGroundingPacketSchema.parse({
    packetVersionId: row.packet_id,
    conceptId: row.concept_id,
    conceptKey: row.concept_key,
    labelFr: row.label_fr,
    riskClass: row.risk_class,
    sourceRequirement: row.source_requirement,
    explanationFr: row.explanation_fr,
    claims: row.claims,
    misconceptions: row.misconceptions,
    examples: row.examples,
    vocabulary: row.vocabulary,
    sources: row.sources,
    reviewedAt: row.reviewed_at,
    reviewAfter: row.review_after,
  });
}

export async function getPublishedKnowledgePackets(
  input: { interestKey: string; conceptTerms: string[] },
  client: SupabaseClient,
): Promise<GenerationGroundingPacket[]> {
  const { data, error } = await client.rpc("get_published_knowledge_packets", {
    p_interest_key: input.interestKey,
    p_concept_terms: [...new Set(input.conceptTerms.map((term) => term.trim()).filter(Boolean))],
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PacketRow[]).slice(0, 12).map(packetFromRow);
}
