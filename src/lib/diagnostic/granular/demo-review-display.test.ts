import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import {
  DEMO_REVIEW_COPY,
  demoReviewDocumentDisplay,
  demoReviewForbiddenDisplay,
} from "./demo-review-display";

it("captures the exact forbidden response without inventing answer-key text", () => {
  const display = demoReviewForbiddenDisplay();
  expect(display).toEqual({ message: DEMO_REVIEW_COPY.forbidden });
  expect(deliveredTextFragments(display)).toEqual([DEMO_REVIEW_COPY.forbidden]);
});

it("retains the authorized saved HTML as the authoritative response document", () => {
  const html = "<!doctype html><main><h1>Bilan enregistré</h1><p>Réponse attendue enregistrée</p></main>";
  const display = demoReviewDocumentDisplay(html);
  expect(display.html).toBe(html);
  expect(deliveredTextFragments(display)).toEqual([html]);
});
