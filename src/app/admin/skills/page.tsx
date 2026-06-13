import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Compétences" description="Taxonomie des compétences de lecture." />
      <ComingSoon phase="Phase 0" note="La gestion des compétences (données initiales déjà semées) sera enrichie en Phase 2." />
    </>
  );
}
