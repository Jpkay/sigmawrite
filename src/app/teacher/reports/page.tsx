import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Rapports" description="Rapports de classe exportables." />
      <ComingSoon phase="Phase 5" note="L'export des rapports arrive en Phase 5." />
    </>
  );
}
