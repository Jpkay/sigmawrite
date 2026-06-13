import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  return (
    <AuthCard
      title="Rejoindre une classe"
      description="Saisis le code fourni par ton enseignant."
    >
      <form className="space-y-4">
        <Field label="Code de classe" placeholder="ABC-123" name="code" />
        <Button type="submit" className="w-full" disabled>
          Rejoindre (Phase 1)
        </Button>
        <p className="text-xs text-muted-foreground">
          La création de compte élève par code de classe arrive en Phase 1.
        </p>
      </form>
    </AuthCard>
  );
}
