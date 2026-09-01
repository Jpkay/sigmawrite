import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page";
import { StudentAccessPending } from "@/components/student-access-pending";
import { PrivacyActions } from "@/components/privacy-actions";
import { getSessionProfile } from "@/lib/auth";
import { getViewableStudents } from "@/lib/db/dashboard";
import { getStudentAccessGate } from "@/lib/db/lifecycle";

export default async function ConsentPage() {
  const session = await getSessionProfile();
  if (!session) return <AuthCard title="Accès et confidentialité" description="Une protection claire sans interrompre les élèves invités."><div className="space-y-4 text-sm text-muted-foreground"><p>Nous collectons uniquement les données nécessaires à l&apos;apprentissage. Aucun profil public, aucune publicité et aucune revente.</p><p>Une invitation scolaire ou familiale active autorise immédiatement l’accès de l’élève. L’adulte responsable conserve les contrôles d’export, de retrait et de suppression.</p><p><Link href="/privacy" className="text-primary hover:underline">Lire la politique de confidentialité</Link> · <Link href="/login" className="text-primary hover:underline">Se connecter</Link></p></div></AuthCard>;

  if (session.role === "student") {
    const gate = await getStudentAccessGate();
    if (!gate.authorized) return <StudentAccessPending />;
    return <><PageHeader title="Accès actif" description="Ton invitation te donne accès aux activités." /><Card><CardContent className="pt-6 text-sm text-muted-foreground">Autorisation : <span className="font-medium text-foreground">{gate.basis === "guardian" ? "responsable" : "invitation scolaire"}</span>. Consulte à tout moment la <Link href="/privacy" className="text-primary hover:underline">politique de confidentialité</Link>.</CardContent></Card></>;
  }

  if (session.role === "parent") {
    const children = await getViewableStudents();
    return <><PageHeader title="Accès et confidentialité" description="Gérez l'autorisation familiale et les droits de vos enfants." /><div className="space-y-3">{children.map((child) => <Card key={child.id}><CardContent className="space-y-3 pt-6"><p className="font-medium">{child.name}</p><PrivacyActions studentId={child.id} name={child.name} /></CardContent></Card>)}</div></>;
  }

  return <AuthCard title="Consentement" description="Cette page concerne les comptes élève et parent."><Link href="/" className="text-sm text-primary hover:underline">Retour à l&apos;accueil</Link></AuthCard>;
}
