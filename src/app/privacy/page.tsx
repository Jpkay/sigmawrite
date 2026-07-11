import { MarketingNav } from "@/components/marketing-nav";

export default function Page() {
  return (
    <>
      <MarketingNav />
      <article className="mx-auto w-full max-w-3xl space-y-4 px-6 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Confidentialité</h1>
        <p>L'application s'adresse à des mineurs ; la confidentialité est une exigence centrale du produit.</p>
        <p>Flux de consentement du responsable, explication adaptée aux élèves, suppression et export des données, comptes contrôlés par l'école.</p>
        <p>Collecte minimale, aucun profil public, aucune publicité, aucune revente de données, pas de messagerie ouverte entre élèves, pas de chat IA libre.</p>
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-5"><h2 className="text-xl font-semibold text-foreground">Si tu es élève</h2><p className="mt-2">Nous gardons tes réponses pour t’aider à progresser. Elles ne servent pas à te juger, à faire de la publicité ou à créer un profil public.</p><p className="mt-2">Un parent ou ton école donne l’autorisation si nécessaire. Tu peux demander ce que nous savons sur toi, corriger une erreur, retirer l’autorisation ou demander la suppression avec un adulte de confiance.</p><p className="mt-2">Les résumés sont contrôlés pour ta sécurité. Il n’y a pas de conversation libre avec une IA.</p></section>
      </article>
    </>
  );
}
