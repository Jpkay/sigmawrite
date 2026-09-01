import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";

export function StudentAccessPending() {
  return <>
    <PageHeader title="Invitation inactive" description="Ton compte doit être associé à une classe ou à un responsable." />
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" /><span>Aucune invitation active ne couvre encore ce compte. Demande à ton enseignant ou à ton responsable de vérifier ton inscription.</span></p>
        <p className="text-sm text-muted-foreground">Dès que l’invitation est active, tu peux continuer immédiatement, quel que soit ton âge.</p>
        <p className="text-sm"><Link href="/privacy" className="text-primary hover:underline">Comment tes données sont protégées</Link></p>
      </CardContent>
    </Card>
  </>;
}
