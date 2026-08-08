import { describe, expect, it } from "vitest";
import {
  agreementLabel,
  jobNameLabel,
  reviewDecisionLabel,
  reviewWorkflowLabel,
  statusLabel,
  textTypeLabel,
} from "./french-labels";

describe("French labels for reviewer-facing internal codes", () => {
  it("translates scheduled jobs and operational states", () => {
    expect(jobNameLabel("retrieval_due")).toBe("Rappels de révision");
    expect(jobNameLabel("data_retention")).toBe("Conservation des données");
    expect(statusLabel("completed")).toBe("Terminée");
  });

  it("translates the editorial review workflow", () => {
    expect(reviewWorkflowLabel("review_complete")).toBe("Évaluation terminée");
    expect(agreementLabel("high_disagreement")).toBe("Désaccord important");
    expect(reviewDecisionLabel("approve_minor")).toBe("Approuver avec changements mineurs");
    expect(textTypeLabel("narrative_nonfiction")).toBe("Récit documentaire");
  });

  it("never exposes a new internal code verbatim", () => {
    expect(jobNameLabel("future_internal_job")).toBe("Tâche planifiée");
    expect(reviewWorkflowLabel("future_workflow_state")).toBe("État éditorial non reconnu");
  });
});
