import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page";
import { ConsentPending } from "@/components/consent-pending";
import { PrivacyActions } from "@/components/privacy-actions";
import { getSessionProfile } from "@/lib/auth";
import { getViewableStudents } from "@/lib/db/dashboard";
import { getStudentConsentGate } from "@/lib/db/lifecycle";

export default async function ConsentPage() {
  const session = await getSessionProfile();
  if (!session) return <AuthCard title="Consentement et confidentialité" description="Une protection claire avant toute activité d'apprentissage."><div className="space-y-4 text-sm text-muted-foreground"><p>Nous collectons uniquement les données nécessaires à l&apos;apprentissage. Aucun profil public, aucune publicité et aucune revente.</p><p>Le consentement peut être donné par un responsable, par un établissement habilité ou par l&apos;élève à partir de 15 ans.</p><p><Link href="/privacy" className="text-primary hover:underline">Lire la politique de confidentialité</Link> · <Link href="/login" className="text-primary hover:underline">Se connecter</Link></p></div></AuthCard>;

  if (session.role === "student") {
    const gate = await getStudentConsentGate();
    if (!gate?.active) return <ConsentPending canSelfConsent={gate?.canSelfConsent ?? false} />;
    return <><PageHeader title="Consentement actif" description="Ton accès aux activités est autorisé." /><Card><CardContent className="pt-6 text-sm text-muted-foreground">Type de consentement : <span className="font-medium text-foreground">{gate.consentType}</span>. Consulte à tout moment la <Link href="/privacy" className="text-primary hover:underline">politique de confidentialité</Link>.</CardContent></Card></>;
  }

  if (session.role === "parent") {
    const children = await getViewableStudents();
    return <><PageHeader title="Consentement du responsable" description="Gérez l'accès et les droits de vos enfants." /><div className="space-y-3">{children.map((child) => <Card key={child.id}><CardContent className="space-y-3 pt-6"><p className="font-medium">{child.name}</p><PrivacyActions studentId={child.id} name={child.name} /></CardContent></Card>)}</div></>;
  }

  return <AuthCard title="Consentement" description="Cette page concerne les comptes élève et parent."><Link href="/" className="text-sm text-primary hover:underline">Retour à l&apos;accueil</Link></AuthCard>;
}
