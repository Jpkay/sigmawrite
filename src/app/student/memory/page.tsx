import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Mémoire" description="Cartes de récupération espacée : même jour, 3 j, 7 j, 21 j, 45 j." />
      <ComingSoon phase="Phase 4" note="Le système de mémoire et de récupération arrive en Phase 4." />
    </>
  );
}
