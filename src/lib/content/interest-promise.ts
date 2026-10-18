import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { interestPromiseKept } from "./interest-coverage";
import { loadInterestCoverageCounts } from "./interest-coverage-load";

/**
 * Roadmap E.6: server-computed flag for the onboarding promise. Fails closed
 * to `false` (the modest line) when the database or service key is missing.
 */
export async function loadInterestPromiseKept(): Promise<boolean> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const counts = await loadInterestCoverageCounts(createServiceClient());
    return counts.dictationTagsAvailable && interestPromiseKept(counts);
  } catch {
    return false;
  }
}
