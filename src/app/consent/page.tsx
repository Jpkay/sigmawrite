import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";

export default function ConsentPage() {
  return (
    <AuthCard
      title="Consentement du responsable"
      description="Parce que l'application s'adresse à des mineurs, le consentement est requis (PRD §10)."
    >
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Nous collectons le minimum de données nécessaires à l'apprentissage.
          Aucun profil public, aucune publicité, aucune revente de données.
        </p>
        <p>
          Vous pourrez à tout moment exporter ou supprimer les données depuis
          votre espace.
        </p>
        <Button className="w-full" disabled>
          J'accepte (Phase 6)
        </Button>
        <p className="text-xs">
          Consultez notre{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </AuthCard>
  );
}
