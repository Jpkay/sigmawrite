import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Réinitialiser le mot de passe"
      description="Recevez un lien par e-mail."
    >
      <form className="space-y-4">
        <Field label="E-mail" type="email" name="email" />
        <Button type="submit" className="w-full" disabled>
          Envoyer le lien (Phase 1)
        </Button>
      </form>
    </AuthCard>
  );
}
