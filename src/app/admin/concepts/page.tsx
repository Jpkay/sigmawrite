import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Concepts" description="Graphe de connaissances : domaines et concepts." />
      <ComingSoon phase="Phase 2" note="La gestion des concepts arrive en Phase 2." />
    </>
  );
}
