import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/actions/student", () => ({ loadDictationCatalog: vi.fn() }));
vi.mock("@/lib/student-store", () => ({ hasStudentBackend: true }));

import { DictationCatalogView } from "./catalog-client";
import { DICTATION_COPY, dictationCatalogDisplay } from "@/lib/diagnostic/granular/dictation-display";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  key: "horses",
  title: "Les chevaux <arrivent>",
  kind: "brevet" as const,
  wordCount: 72,
  gradeMin: 6,
  gradeMax: 9,
  focus: "Accorder les noms au pluriel",
  estimatedMinutes: 20,
  lastScore: 8,
  lastAt: "2026-09-13T08:00:00.000Z",
  attempts: 1,
  audioMode: "server" as const,
};

it("renders the same exact catalog strings as the delivery projection", () => {
  const display = dictationCatalogDisplay([row]);
  const html = renderToStaticMarkup(React.createElement(DictationCatalogView, { rows: [row], error: "" }));
  const text = html.replace(/<[^>]+>/gu, "");
  expect(html).toContain(display.entries[0].kind);
  expect(html).toContain(display.entries[0].grade);
  expect(html).toContain(display.entries[0].meta);
  expect(text).toContain(display.entries[0].score);
  expect(html).toContain(display.entries[0].control);
  expect(html).toContain("Les chevaux &lt;arrivent&gt;");
  expect(html).not.toContain("<arrivent>");
});

it("renders each bounded catalog state", () => {
  expect(renderToStaticMarkup(React.createElement(DictationCatalogView, { rows: null, error: "" }))).toContain(DICTATION_COPY.catalogLoading);
  expect(renderToStaticMarkup(React.createElement(DictationCatalogView, { rows: [], error: "" }))).toContain(DICTATION_COPY.catalogEmpty);
  expect(renderToStaticMarkup(React.createElement(DictationCatalogView, { rows: null, error: DICTATION_COPY.catalogError }))).toContain(`role="alert"`);
  expect(renderToStaticMarkup(React.createElement(DictationCatalogView, { rows: null, error: DICTATION_COPY.catalogError }))).toContain(DICTATION_COPY.catalogError);
});
