import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { REVIEW_STATUS_LABEL, REVIEW_STATUS_VARIANT } from "@/lib/content/review-status";
import { requireRole } from "@/lib/auth";
import { getContentLibrary } from "@/lib/db/content";
import { difficultyBandLabel } from "@/lib/scoring/band";
import { ContentControls } from "./content-controls";

export default async function ContentLibraryPage() {
  await requireRole(["platform_admin", "content_reviewer"]);
  const approved = await getContentLibrary();
  return <>
    <PageHeader title="Bibliothèque de contenu" description="Textes approuvés, partagés et assignables aux élèves." />
    {approved.length === 0 ? <Card><CardContent className="flex flex-col items-start gap-3 pt-6"><p className="text-sm text-muted-foreground">Aucun texte approuvé pour l&apos;instant.</p><Link href="/admin/content/review" className={buttonVariants()}>Aller à la révision</Link></CardContent></Card> : (
      <div className="space-y-2">{approved.map((item) => <Card key={item.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><Link href={`/admin/texts/${item.textId}`} className="font-medium hover:underline">{item.title}</Link><p className="text-xs text-muted-foreground">{item.textType} · {difficultyBandLabel(item.difficultyBand)} · difficulté {item.overallDifficulty ?? "—"} · {item.questionCount} questions · v{item.versionNumber}</p></div><div className="flex items-center gap-2"><Badge variant={REVIEW_STATUS_VARIANT[item.reviewStatus]}>{REVIEW_STATUS_LABEL[item.reviewStatus]}</Badge><ContentControls item={item} /></div></CardContent></Card>)}</div>
    )}
  </>;
}
