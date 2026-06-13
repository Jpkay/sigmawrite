import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Séance de lecture" description="Lis le texte, réponds aux questions, rédige un résumé." />
      <ComingSoon phase="Phase 1" note="La séance de lecture adaptative arrive en Phase 1." />
    </>
  );
}
