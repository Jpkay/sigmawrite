import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { PrivacyActions } from "@/components/privacy-actions";
import { getViewableStudents } from "@/lib/db/dashboard";

export default async function ParentPrivacyPage() {
  const children = await getViewableStudents();

  return (
    <>
      <PageHeader
        title="Confidentialité"
        description="Consentement, export et suppression des données de votre enfant (RGPD / CNIL)."
      />

      <Card className="mb-6">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Nous collectons le minimum de données nécessaires à l&apos;apprentissage.
          Aucun profil public, aucune publicité, aucune revente. Vous pouvez à
          tout moment exporter les données ou en demander la suppression.
        </CardContent>
      </Card>

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun enfant lié à votre compte.</p>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <Card key={child.id}>
              <CardContent className="space-y-3 pt-6">
                <p className="font-medium">{child.name}</p>
                <PrivacyActions studentId={child.id} name={child.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
