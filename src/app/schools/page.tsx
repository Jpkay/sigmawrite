import { MarketingNav } from "@/components/marketing-nav";

export default function Page() {
  return (
    <>
      <MarketingNav />
      <article className="mx-auto w-full max-w-3xl space-y-4 px-6 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pour les écoles</h1>
        <p>Donnez à chaque élève une pratique de lecture au bon niveau, sans préparation supplémentaire pour l'enseignant.</p>
        <p>Tableau de bord de classe, lacunes de compétences, groupes recommandés, rapports exportables.</p>
        <p>Confidentialité et sécurité au cœur : RLS dès le premier jour, comptes élèves contrôlés par l'école, aucune fonctionnalité sociale.</p>
      </article>
    </>
  );
}
