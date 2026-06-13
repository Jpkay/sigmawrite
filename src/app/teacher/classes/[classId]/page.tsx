import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Détail de la classe" description="Bandes de lecture, lacunes, performance par domaine." />
      <ComingSoon phase="Phase 5" note="Le tableau de bord détaillé de classe arrive en Phase 5." />
    </>
  );
}
