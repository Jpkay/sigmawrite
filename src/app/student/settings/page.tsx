import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Paramètres" description="Préférences du compte." />
      <ComingSoon phase="Phase 0" note="Les paramètres élève seront enrichis au fil des phases." />
    </>
  );
}
