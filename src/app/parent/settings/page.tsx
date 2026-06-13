import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Paramètres" description="Compte et enfants liés." />
      <ComingSoon phase="Phase 0" note="Les paramètres parent seront enrichis au fil des phases." />
    </>
  );
}
