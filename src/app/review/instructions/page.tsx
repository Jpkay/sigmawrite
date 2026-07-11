import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewerAccess } from "@/lib/db/reviews";
import { InstructionsAcknowledge } from "./instructions-acknowledge";

export default async function ReviewInstructionsPage() {
  const session = await requireActiveReviewer();
  const access = await getReviewerAccess(session.id);
  return <>
    <PageHeader title="Consignes d’évaluation" description="Temps de lecture : moins de cinq minutes." />
    <div className="max-w-3xl space-y-8 text-sm leading-7">
      <p className="border-l-2 border-primary pl-4 text-base">Lisez le texte et les questions comme si vous les prépariez pour un élève. Évaluez la qualité de la langue, l’adéquation au niveau annoncé et la clarté des questions. Vos réponses sont enregistrées automatiquement. Après validation finale, votre évaluation ne pourra plus être modifiée.</p>
      <section><h2 className="text-lg font-semibold">Échelle en quatre points</h2><dl className="mt-3 grid gap-3 sm:grid-cols-2"><div><dt className="font-medium">4 — Excellent</dt><dd className="text-muted-foreground">Prêt à être utilisé tel quel.</dd></div><div><dt className="font-medium">3 — Bon</dt><dd className="text-muted-foreground">Solide, avec de petites améliorations possibles.</dd></div><div><dt className="font-medium">2 — À améliorer</dt><dd className="text-muted-foreground">Un travail de révision est nécessaire.</dd></div><div><dt className="font-medium">1 — Inacceptable</dt><dd className="text-muted-foreground">Problème important qui empêche l’utilisation.</dd></div></dl></section>
      <section><h2 className="text-lg font-semibold">Décision globale</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground"><li><strong className="text-foreground">Approuver :</strong> utilisable sans modification.</li><li><strong className="text-foreground">Approuver avec changements mineurs :</strong> quelques retouches simples.</li><li><strong className="text-foreground">À réviser :</strong> changements substantiels nécessaires.</li><li><strong className="text-foreground">Rejeter :</strong> le texte ne peut pas être corrigé de manière raisonnable.</li></ul></section>
      <section className="grid gap-7 sm:grid-cols-2"><div><h2 className="text-lg font-semibold">Dans le texte</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground"><li>français naturel et correct ;</li><li>vocabulaire adapté au niveau ;</li><li>intérêt et respect de l’âge ;</li><li>faits exacts et contexte culturel approprié.</li></ul></div><div><h2 className="text-lg font-semibold">Dans les questions</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground"><li>une réponse attendue réellement correcte ;</li><li>une formulation claire ;</li><li>des choix plausibles mais non ambigus ;</li><li>un lien direct avec le texte.</li></ul></div></section>
      <section><h2 className="text-lg font-semibold">Commentaires utiles</h2><p className="mt-2 text-muted-foreground">Soyez précis : « Le mot “pérenniser” paraît trop difficile pour ce niveau » ou « Les réponses B et C sont toutes les deux défendables au paragraphe 3 ». Une évaluation prend généralement 6 à 10 minutes.</p></section>
      <p className="rounded-md bg-muted p-4"><strong>Indépendance et confidentialité :</strong> ne discutez pas de vos notes avec les autres évaluateurs avant d’avoir validé. Vous ne verrez pas leurs réponses dans ce portail.</p>
      {access?.acknowledgedAt ? <div className="flex flex-wrap items-center gap-3 text-[color:var(--success)]"><CheckCircle2 className="size-5" /><span>Consignes confirmées le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(access.acknowledgedAt))}.</span><Button asChild variant="outline"><Link href="/review">Retour à mes textes</Link></Button></div> : <InstructionsAcknowledge />}
    </div>
  </>;
}
