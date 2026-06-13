import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Texte" description="Versions, difficulté, signalements de factualité." />
      <ComingSoon phase="Phase 2" note="Le détail d'un texte arrive en Phase 2." />
    </>
  );
}
