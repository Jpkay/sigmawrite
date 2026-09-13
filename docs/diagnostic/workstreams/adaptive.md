# Adaptive workstream

## 2026-09-13 — P2.01 inventory and P2.02 trace runner

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Source constraint: revision-41 frozen candidate at `~/.codex/release-workspaces/sigmawrite-r41-evidence-773d3f7`, candidate checksum `sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab`, 360/544 assessment targets.
- P2.01 evidence: `docs/diagnostic/profile-test-inventory-2026-09-13.md` maps the current contrast tests and missing trace coverage.
- P2.02 implementation: `src/lib/diagnostic/granular/testing/profile-trace-runner.ts`, `src/lib/diagnostic/granular/profile-trace-runner.test.ts`, and `scripts/run-revision-41-profile-trace.mts`.
- Correctness fix: `inspectProfileDiscrimination` now requires every declared known and weak target to have resolved within-occasion evidence before `passed` can be true.
- First P2.03/P2.04 slice: fixed revision-41 answers for `aller` at present (known) versus imparfait (weak), with exact released probe and activity evidence.
- Trace result: six released production questions, 30 seconds each, 180 cumulative active seconds. The selector asked three present questions (`branch_coverage`, then two `confirmation`) followed by three imparfait questions (`step_up`, then two `confirmation`). Both sides resolved within the sitting while both remain officially uncertain after one occasion. Present probability is `0.9998285616320933`; imparfait probability is `0.001164991990680065` with a provisional gap.
- Next activity: released instruction `0d1b028e-29cf-5f2c-aab9-7c95b31cfe2c`, content `french-v3-teaching:imparfait:aller`. Exact trace: `docs/diagnostic/revision-41-aller-tense-trace-2026-09-13.json`.
- Adaptive-plan correction: a strong direct prerequisite that meets the existing `.65` teaching-readiness rule no longer becomes unavailable to dependents only because its own independent check is unavailable. Its missing check and unresolved state remain reported. A `.64` counterexample still blocks the dependent lesson.
- Validation: 36 tests passed across `profile-discrimination`, `profile-trace-runner`, `activity-plan`, `verb-tense-profile`, `compound-tense-profile`, and `conjugation-form-family`; focused ESLint passed. Two trace-script runs produced the identical report SHA-256 `c9aa9dfae0a1ecc835d71838a8c779a23b450e003e75f12291c138279cbe4804`. Repository-wide TypeScript validation is currently blocked by the unrelated missing module `src/lib/diagnostic/granular/practice-player-display` imported by `src/lib/actions/student.ts`.
- Limits: synthetic technical evidence with explicit prerequisite assumptions; no owner-review, mastery, calibration, browser, database, or deployed-journey claim.

## 2026-09-13 — P2.03 individual-verb contrast

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Profile: present `être` known versus present `avoir` weak, using the same frozen revision-41 checksum.
- Trace result: six released production questions at difficulty `.5`, 30 seconds each and 180 cumulative active seconds. The selector first asked three `avoir` questions (`branch_coverage`, then two `confirmation`) and then three `être` questions with the same reason sequence.
- Evidence: `être` probability `0.9998285616320933`; `avoir` probability `0.001164991990680065` with a provisional gap. Both targets resolved within the sitting and remain officially uncertain after one occasion.
- Next activity: released instruction `6a4bcdfd-58b3-5c69-8e7a-5445466e0a5e`, content `french-v3-teaching:present:verb:avoir`.
- Omission counterexample: stopping after the three `avoir` questions leaves `être` unresolved and `passed: false`; sampling only the weak side cannot satisfy the contrast.
- Exact evidence: `docs/diagnostic/revision-41-etre-avoir-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/verb-profile-trace.test.ts`; runner command: `scripts/run-revision-41-verb-profile-trace.mts`.
- Validation: the focused 18-test suite and ESLint passed. With an explicitly nonexistent revision-41 artifact path, both artifact-bound suites collect cleanly and report four skipped tests instead of reading a missing file. Two report runs produced identical SHA-256 `960ee694205a22a25011d010fad987da56370e0fed2023e9d3a8a5dd3f0a78d9`. Repository-wide TypeScript validation is currently blocked by unrelated widened-string fixtures in `src/lib/actions/language-coaching-delivery.test.ts` (`tip.kind` inferred as `string`).
- Limits: synthetic fixed answers and explicit prerequisite history; no owner-review, mastery, calibration, browser, database, or deployed-journey claim.

Next atomic task: P2.03, reverse the same released verb pair (`avoir` known, `être` weak) to check order-independent discrimination and exact weak-verb routing.

## 2026-09-13 — P2.05 grammar-construction contrast

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Profile: controlled production of relative clauses known versus controlled production of completive clauses weak, using distinct approved grammar nodes in the frozen revision-41 candidate.
- Trace result: seven released production questions at difficulty `.5`, 30 seconds each and 210 cumulative active seconds. The selector asked three completive questions (`step_up`, then two `confirmation`) followed by four relative-clause questions (`gap_check`, then three `confirmation`). Each item has released guess probability `.25`; four successes are needed to fall below the engine's `.01` chance-of-streak ceiling, while three consistent failures already satisfy the released weak-signal requirements.
- Evidence: relative-clause probability `0.9940814954403842`; completive-clause probability `0.0023647650014779796` with a provisional gap. Both targets resolve within the sitting and remain officially uncertain after one occasion.
- Next activity: released instruction `bba9caf6-3a01-51c3-803b-0ac606510949`, content `french-v3-teaching:completive:production`.
- Omission counterexample: stopping after the three completive questions leaves the known relative-clause target unresolved and `passed: false`.
- Exact evidence: `docs/diagnostic/revision-41-grammar-construction-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/grammar-profile-trace.test.ts`; runner command: `scripts/run-revision-41-grammar-profile-trace.mts`.
- Validation: 20 focused tests passed across the grammar trace, discrimination, activity-plan, relative-mode, and completive-production suites; focused ESLint and diff checks passed. An explicitly missing revision-41 source cleanly skips the two artifact-bound tests. Two report runs produced identical SHA-256 `02de1085192f748d25aacc59a2fc789cfcf5762c226b4dd5c6881c413703f261`.
- Limits: focused synthetic trace with explicit prerequisite history and no release-scope/full-sitting claim; no owner-review, mastery, calibration, browser, database, or deployed-journey claim.

Next atomic task: P2.05, reverse the relative/completive construction outcomes to verify order-independent routing to the exact relative-clause lesson.
