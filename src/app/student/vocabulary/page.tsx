import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Vocabulaire" description="Les mots cibles que tu travailles et révises." />
      <ComingSoon phase="Phase 4" note="La maîtrise et la rétention du vocabulaire arrivent en Phase 4." />
    </>
  );
}
