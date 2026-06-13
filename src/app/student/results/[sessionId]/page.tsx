import { PageHeader, ComingSoon } from "@/components/page";

export default function Page() {
  return (
    <>
      <PageHeader title="Résultats" description="Ton score, tes points forts et la prochaine action recommandée." />
      <ComingSoon phase="Phase 1" note="La page de résultats arrive en Phase 1." />
    </>
  );
}
