import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Découverte" description="Niveau, contexte francophone et centres d'intérêt." />
      <ComingSoon phase="Phase 1" note="Le sélecteur d'intérêts et le flux d'intégration arrivent en Phase 1." />
    </>
  );
}
