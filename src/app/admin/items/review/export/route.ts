import type { NextRequest } from "next/server";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { getCompetencyItems } from "@/lib/db/items";
import { reviewRowsToCsv } from "@/lib/review/csv";

const sections = new Set(["reading_comprehension", "grammar", "spelling", "conjugation"]);
const tiers = new Set(["foundation", "core", "stretch"]);

export async function GET(request: NextRequest) {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  if (reviewer.role === "content_reviewer") await requireActiveReviewer();
  const sectionParam = request.nextUrl.searchParams.get("section") ?? "";
  const tierParam = request.nextUrl.searchParams.get("tier") ?? "";
  const section = sections.has(sectionParam) ? sectionParam : undefined;
  const difficultyTier = tiers.has(tierParam) ? tierParam : undefined;
  const items = await getCompetencyItems({
    status: "needs_human_review",
    promptVersion: "diagnostic-bank-v2",
    section,
    difficultyTier,
    limit: 1000,
  });
  const headers = [
    "item_id", "section", "node_key", "node_label", "evidence_key",
    "evidence_expectation", "observable_action", "success_criteria",
    "difficulty_tier", "difficulty", "prompt_family", "response_type",
    "validator_type", "prompt", "correct_answer", "choices", "qc_gates",
    "review_decision", "review_note",
  ];
  const rows = items.map((item) => [
    item.id,
    item.diagnostic?.sectionKey,
    item.nodeKey,
    item.nodeLabel,
    item.diagnostic?.evidenceKey,
    item.diagnostic?.evidenceExpectation,
    item.diagnostic?.observableActionFr,
    item.diagnostic?.successCriteria,
    item.diagnostic?.difficultyTier,
    item.difficulty,
    item.diagnostic?.promptFamily,
    item.responseType,
    item.validatorType,
    item.promptFr,
    item.correctAnswer,
    item.choices.map((choice) => ({ text: choice.text, correct: choice.correct, feedbackFr: choice.feedbackFr })),
    item.qcGates,
    "",
    "",
  ]);
  const suffix = [section, difficultyTier].filter(Boolean).join("-") || "all";
  return new Response(reviewRowsToCsv([headers, ...rows]), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="plume-diagnostic-v2-review-${suffix}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
