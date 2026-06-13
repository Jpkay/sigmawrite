import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Devoirs" description="Assignations de lecture à faible préparation." />
      <ComingSoon phase="Phase 5" note="La création de devoirs arrive en Phase 5." />
    </>
  );
}
