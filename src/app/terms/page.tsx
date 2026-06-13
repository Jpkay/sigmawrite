import { MarketingNav } from "@/components/marketing-nav";

export default function Page() {
  return (
    <>
      <MarketingNav />
      <article className="mx-auto w-full max-w-3xl space-y-4 px-6 py-16 text-muted-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Conditions d'utilisation</h1>
        <p>Document préliminaire. Les conditions définitives seront publiées avant le pilote.</p>
      </article>
    </>
  );
}
