import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Confidentialité" description="Export et suppression des données (PRD §10)." />
      <ComingSoon phase="Phase 6" note="Les flux d'export et de suppression arrivent en Phase 6." />
    </>
  );
}
