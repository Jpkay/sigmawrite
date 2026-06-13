import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Révision du contenu" description="Approuver / rejeter / éditer les candidats générés." />
      <ComingSoon phase="Phase 2" note="Le flux de révision (scoring + modération) arrive en Phase 2." />
    </>
  );
}
