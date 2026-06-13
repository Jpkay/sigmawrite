import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Textes de référence" description="Passages verrouillés pour la calibration (PRD §O)." />
      <ComingSoon phase="Phase 6" note="La gestion des textes de référence arrive en Phase 6." />
    </>
  );
}
