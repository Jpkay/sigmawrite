import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Devoirs" description="Assigner une lecture à une classe ou à un groupe." />
      <ComingSoon
        phase="Phase 5 — en cours"
        note="La création de devoirs nécessite une table assignments + l'affichage côté élève. Les tableaux de bord, lacunes, groupes et l'export de rapports sont déjà en place sur des données réelles."
      />
    </>
  );
}
