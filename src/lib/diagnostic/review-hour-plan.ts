import { stableUuid } from "@/lib/lexicon/baseline";
import plan from "../../../generated/review-hour-plan.json";

/** The same fixed launch selection is used for both the queue and its counters. */
export const reviewHourItemIds = plan.items.map((entry) =>
  stableUuid("sigmawrite-diagnostic-item", `${plan.bankKey}:${entry.itemKey}`),
);
export const reviewHourHref = "/admin/items/review?plan=review-hour";
