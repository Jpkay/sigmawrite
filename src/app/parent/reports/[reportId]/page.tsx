import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Rapport hebdomadaire" description="Le rapport de progrès détaillé." />
      <ComingSoon phase="Phase 5" note="Les rapports hebdomadaires arrivent en Phase 5." />
    </>
  );
}
