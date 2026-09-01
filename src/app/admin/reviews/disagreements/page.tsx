import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getAdminReviewVersions } from "@/lib/db/reviews";
import { agreementLabel } from "@/lib/presentation/french-labels";
import { difficultyBandLabel } from "@/lib/scoring/band";
import { ReviewAdminNav } from "../review-nav";

export default async function ReviewDisagreementsPage(){await requireRole(["platform_admin"]);const versions=(await getAdminReviewVersions()).filter(v=>["mixed","high_disagreement"].includes(v.agreement??""));return <><PageHeader title="Désaccords à résoudre" description="Comparez les évaluations seulement après la soumission de tous les avis requis."/><ReviewAdminNav/>{versions.length===0?<p className="py-12 text-center text-sm text-muted-foreground">Aucun désaccord en attente.</p>:<div className="divide-y divide-border border-y border-border">{versions.map(version=><article key={version.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{version.candidate.generated.title}</h2><Badge variant={version.agreement==="high_disagreement"?"default":"secondary"}>{agreementLabel(version.agreement)}</Badge></div><p className="mt-2 text-sm text-muted-foreground">Score moyen {version.averageScore?.toFixed(2)??"—"} · écart {version.ratingSpread??"—"} · {difficultyBandLabel(version.candidate.input.targetReadingBand)}</p></div><Button asChild variant="outline"><Link href={`/admin/reviews/${version.id}`}>Comparer<ArrowRight/></Link></Button></article>)}</div>}</>}
