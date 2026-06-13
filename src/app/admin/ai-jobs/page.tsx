import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Tâches IA" description="File des tâches de génération et leur statut." />
      <ComingSoon phase="Phase 2" note="Le suivi des tâches IA arrive en Phase 2." />
    </>
  );
}
