import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Progrès" description="Ta bande de lecture et l'évolution de tes compétences." />
      <ComingSoon phase="Phase 3" note="Les estimations de compétences et le suivi de progrès arrivent en Phase 3." />
    </>
  );
}
