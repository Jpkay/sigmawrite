import { MarketingNav } from "@/components/marketing-nav";

export default function Page() {
  return (
    <>
      <MarketingNav />
      <article className="mx-auto w-full max-w-3xl space-y-4 px-6 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pour les parents</h1>
        <p>Vous voulez une preuve que votre enfant progresse vraiment. Nous la rendons concrète.</p>
        <p>Bande de lecture, niveau de confiance, minutes de lecture, vocabulaire, compétences en progression et à travailler.</p>
        <p>Trois catégories claires : ce que votre enfant lit avec aisance, avec soutien, et ce qui est encore trop difficile.</p>
      </article>
    </>
  );
}
