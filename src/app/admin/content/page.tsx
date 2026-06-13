import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Contenu" description="Bibliothèque de textes et versions." />
      <ComingSoon phase="Phase 2" note="La gestion de la bibliothèque de contenu arrive en Phase 2." />
    </>
  );
}
