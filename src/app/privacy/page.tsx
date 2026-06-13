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
      </article>
    </>
  );
}
