import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Prompts" description="Versions de prompts actives." />
      <ComingSoon phase="Phase 2" note="La gestion des versions de prompts arrive en Phase 2." />
    </>
  );
}
