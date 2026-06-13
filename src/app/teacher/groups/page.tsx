import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Groupes d'intervention" description="Groupes recommandés selon les lacunes de compétences." />
      <ComingSoon phase="Phase 5" note="Le regroupement automatique arrive en Phase 5." />
    </>
  );
}
