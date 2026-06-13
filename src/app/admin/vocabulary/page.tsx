import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Vocabulaire" description="Items de vocabulaire et difficulté." />
      <ComingSoon phase="Phase 2" note="La gestion du vocabulaire arrive en Phase 2." />
    </>
  );
}
