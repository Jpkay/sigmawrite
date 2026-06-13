import type { ReviewStatus } from "@/lib/types";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: "Brouillon",
  auto_approved: "Auto-approuvé",
  needs_human_review: "Révision requise",
  human_approved: "Approuvé",
  rejected: "Rejeté",
  retired: "Retiré",
  benchmark_locked: "Référence verrouillée",
};

export const REVIEW_STATUS_VARIANT: Record<
  ReviewStatus,
  "default" | "secondary" | "success" | "outline"
> = {
  draft: "secondary",
  auto_approved: "success",
  needs_human_review: "default",
  human_approved: "success",
  rejected: "outline",
  retired: "secondary",
  benchmark_locked: "success",
};
