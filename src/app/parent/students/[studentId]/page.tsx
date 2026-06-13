import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Progrès de l'enfant" description="Vue détaillée d'un enfant lié." />
      <ComingSoon phase="Phase 5" note="Le détail par enfant arrive en Phase 5." />
    </>
  );
}
