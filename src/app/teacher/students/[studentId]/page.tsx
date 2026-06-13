import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Élève" description="Preuves de lecture et compétences d'un élève." />
      <ComingSoon phase="Phase 5" note="Le détail par élève arrive en Phase 5." />
    </>
  );
}
