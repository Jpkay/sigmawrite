import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getContentReuseCalibrationReport } from "@/lib/content/reuse/runtime";
import { createServiceClient } from "@/lib/supabase/server";
import { ReuseRolloutManager } from "./reuse-rollout-manager";

export default async function ContentReusePage() {
  await requireRole(["platform_admin"]);
  const report = await getContentReuseCalibrationReport(createServiceClient());
  return <>
    <PageHeader
      title="Réutilisation calibrée"
      description="Observer la compatibilité pédagogique, limiter l’essai réel et promouvoir uniquement avec des résultats mesurés."
    />
    <ReuseRolloutManager report={report} />
  </>;
}
