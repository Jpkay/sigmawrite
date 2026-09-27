# Coverage workstream: discourse-relation family

Date: 2026-09-13

Scope: reviewable local drafts for C083 to C090 only. This workstream does not change the shared bank, graph, engine, roadmap, release selection, deployment state or human-review provenance.

## Prepared targets

| Registry targets | Approved evidence | Local draft |
| --- | --- | --- |
| C083, C085, C087, C089 | `reading-analysis` / `receptive` | 12 multiple-choice items per target: six initial and six learning, with three genuine counterexamples in each pool |
| C084, C086, C088, C090 | `writing-controlled-production` / `controlled_production` | 16 transformations per target: eight initial and eight learning, each with a unique assessed sentence |

The targets retain the exact prerequisites and evidence requirements in `remaining-target-goals-2026-09-13.json`. The four relations are consequence, contrast, concession and chronology. Each relation has separate recognition and controlled-production teaching content, for eight lessons total. Every lesson remains `draft_requires_review`, every item remains `needs_human_review`, and all eight content-review records remain `awaiting_real_review`.

The production prompts supply the connector and both source ideas. Only the requested ordered combination, with or without a final point, is accepted. Reversed order is rejected. The claim is therefore limited to sentence-level recognition and controlled combination; it does not establish autonomous discourse production.

Material annotations remain strictly source-anchored. The production builder derives each displayed source sentence once and uses that exact capitalized form in both the prompt and `materialExposure`; the combined assessed sentence is anchored in `correctAnswer`. `questionMaterialKeys` validates this pairing before evidence provenance is attached.

## Local verification

- `npx vitest run src/lib/diagnostic/granular/discourse-relation-family.test.ts`: one file, five tests passed.
- `npx eslint` on the three owned TypeScript family files: passed.
- `npx tsc --noEmit`: the owned files produce no diagnostics, but the final repository-wide run is currently blocked by concurrent shared-engine edits at `src/lib/diagnostic/granular/engine.ts:525-527` (`last` is possibly undefined). This workstream did not modify that file.
- The expansion CLI generated and then checked a temporary draft with 112 questions, 56 initial items, 56 learning items and `draft_requires_review` status. The smoke artifact was removed afterward.

## Handoff boundary

Coordinator follow-up: committed in `f98a190`. The concurrent TypeScript issue
was resolved during integration; the final repository suite passes 1,978 tests
and TypeScript. C083–C090 question/lesson tasks are recorded as implemented,
not published or owner-reviewed.

The family source, expansion builder, focused tests and bounded generator are locally ready for coordinator integration. Revision selection and R42/R43 integration remain with the main workstream. No shared generated artifact was created or updated here, and no approval or publication state was asserted.
