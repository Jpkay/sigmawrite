import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getContentTextDetail } from "@/lib/db/content";
import { REVIEW_STATUS_LABEL, REVIEW_STATUS_VARIANT } from "@/lib/content/review-status";
import { paragraphsFromText } from "@/lib/content/text-format";
import { difficultyBandLabel } from "@/lib/scoring/band";

export default async function TextDetailPage({ params }: { params: Promise<{ textId: string }> }) {
  await requireRole(["platform_admin", "content_reviewer"]);
  const { textId } = await params;
  const text = await getContentTextDetail(textId);
  if (!text) notFound();
  return <><PageHeader title={text.title} description={`Version ${text.versionNumber} · ${text.questionCount} questions`} /><div className="mb-4 flex flex-wrap gap-2"><Badge variant={REVIEW_STATUS_VARIANT[text.reviewStatus]}>{REVIEW_STATUS_LABEL[text.reviewStatus]}</Badge><Badge variant="secondary" title={text.difficultyBand ? `Code interne : ${text.difficultyBand}` : undefined}>{difficultyBandLabel(text.difficultyBand)}</Badge><Badge variant="secondary">Difficulté {text.overallDifficulty ?? "—"}</Badge></div><Card><CardContent className="space-y-4 pt-6">{paragraphsFromText(text.body).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`} className="leading-relaxed">{paragraph}</p>)}</CardContent></Card></>;
}
