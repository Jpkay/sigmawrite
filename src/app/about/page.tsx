import { MarketingNav } from "@/components/marketing-nav";

export default function Page() {
  return (
    <>
      <MarketingNav />
      <article className="mx-auto w-full max-w-3xl space-y-4 px-6 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">À propos</h1>
        <p>Reading to Learn est un moteur de lecture académique et d'acquisition de connaissances pour le secondaire.</p>
        <p>Notre thèse : l'enseignement de la lecture en classe est limité par le format un-vers-plusieurs. Le produit offre à chaque élève une pratique individualisée, au bon niveau, sur des sujets qui l'intéressent.</p>
        <p>Les enseignants enseignent. L'application personnalise la pratique, la mémoire et la réparation des bases que les enseignants n'ont rarement le temps d'offrir à chaque élève.</p>
      </article>
    </>
  );
}
