import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Classes" description="Vos classes et leurs élèves." />
      <ComingSoon phase="Phase 5" note="La gestion des classes arrive en Phase 5." />
    </>
  );
}
