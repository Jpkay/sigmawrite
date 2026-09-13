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
- Validation: 20 focused tests passed across the grammar trace, discrimination, activity-plan, relative-mode, and completive-production suites; repository TypeScript, focused ESLint, and diff checks passed. An explicitly missing revision-41 source cleanly skips the two artifact-bound tests. Two report runs produced identical SHA-256 `02de1085192f748d25aacc59a2fc789cfcf5762c226b4dd5c6881c413703f261`.
- Limits: focused synthetic trace with explicit prerequisite history and no release-scope/full-sitting claim; no owner-review, mastery, calibration, browser, database, or deployed-journey claim.

Next atomic task: P2.05, reverse the relative/completive construction outcomes to verify order-independent routing to the exact relative-clause lesson.

## 2026-09-13 — P2.06 spelling contrast

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Profile: production of `on/om` known versus production of the `m` before `m`, `b`, or `p` rule weak, using the frozen revision-41 candidate.
- Trace result: ten released questions at difficulty `.5`, 30 seconds each and 300 cumulative active seconds. The selector probes the harder rule, steps down to the prerequisite, collects seven correct `on/om` answers, then rechecks the boundary with two more harder-rule failures. Reasons are `step_up`, `step_down`, six `confirmation`, `recheck_boundary`, and `confirmation`.
- Evidence: `on/om` probability `0.9839285148569438`; `m` before `m/b/p` probability `0.00793650793650794` with a provisional gap. Both resolve within the sitting and remain officially uncertain after one occasion.
- Next activity: released instruction `dae03f59-2f02-5c9e-9dab-b62b38cc0e9a`, content `spelling-m-before-mbp`.
- Omission counterexample: stopping after the known `on/om` side resolves leaves the weak `m` before `m/b/p` target unresolved and `passed: false`.
- Novelty guard: sentence-only receipts yield no eligible evidence for the released recognition prerequisite with `novelWordsRequired`; word receipts resolve it only after also satisfying the two-contrasting-error and chance-of-guessing requirements. The trace runner now emits explicit synthetic word keys for that prerequisite. No production engine rule changed.
- Exact evidence: `docs/diagnostic/revision-41-spelling-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/spelling-profile-trace.test.ts`; command: `scripts/run-revision-41-spelling-profile-trace.mts`. Two report runs produced identical SHA-256 `2bb81a1c31797504b337edc89690af198b51020936703ccc367a84dfb775d728`.

## 2026-09-13 — P2.07 short-reading contrast

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Profile: locating explicit information in a short narrative known versus inferring a local cause in a short narrative weak, preserving the same interpretation mode and narrative text type.
- Trace result: seven released questions at difficulty `.5`, 60 seconds each and 420 cumulative active seconds. One explicit-reading question establishes branch coverage, three cause-inference failures resolve the weak side, then three more explicit-reading successes resolve the known side.
- Evidence: explicit-location probability `0.9940814954403842`; local-cause probability `0.0023647650014779796` with a provisional gap. Each target has the required distinct narrative contexts; both remain officially uncertain after one occasion.
- Next activity: released instruction `bb273413-624f-581e-b580-af95af1cf69a`, content `french-v3-teaching:reading:inferer_cause_locale:narrative`.
- Omission counterexample: stopping after the local-cause side resolves leaves explicit location unresolved and `passed: false`.
- Exact evidence: `docs/diagnostic/revision-41-short-reading-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/short-reading-profile-trace.test.ts`; command: `scripts/run-revision-41-short-reading-profile-trace.mts`. Two report runs produced identical SHA-256 `1cfc5883716f73324a770bc6e6825ae7122a00a70ed4d269331f3239dec77445`.

- Combined validation: 26 focused tests passed across the two traces, discrimination, activity planning, `on/om`, and reading-family routing; focused ESLint and missing-artifact portability passed. Repository-wide TypeScript is currently blocked by an unrelated unsafe cast in `src/lib/diagnostic/granular/passe-recent-modal-family.test.ts:41`.
- Limits: these are independent focused synthetic cases with explicit prerequisite history. They do not show that one mixed 35-minute revision-41 sitting reaches every declared contrast, balances all supported domains, retains pause/resume state, or chooses the same activities after competing evidence. P2.08/P2.09 behavior and the P2.10 full mixed profile remain outstanding; no category is complete from one pair.

Next atomic task: P2.08, add fixed skipped, guessed, and inconsistent-response profiles before composing the 35-minute mixed trace.

## 2026-09-13 — P2.08 guessing, skipping, and contradiction matrix

- Status: implemented and narrowly validated; release is owned by the coordinator.
- Scope: three fixed response patterns against released target `orthographier_nasale_on_om::writing-controlled-production` from the frozen revision-41 candidate. This target has no prerequisites, so synthetic foundation evidence cannot account for the result.
- High-guess-space case: three correct binary-choice responses consume 90 active seconds and move probability from `0.6428571428571428` to `0.7641509433962264` to `0.8536299765807963`. Evidence remains direct but uncertain and unresolved because the `.5` guess probability does not meet the confirmation rule. This describes the response space; it does not establish that a student guessed.
- Skip case: three skips consume 90 active seconds while retaining `answeredCount: 0`, `skippedCount: 3`, probability `.5`, zero distinct evidence items, `status: unknown`, and `evidence: untested`. No provisional gap or instruction is created.
- Contradiction case: correct, incorrect, correct consumes 90 active seconds and moves probability from `0.6428571428571428` to `0.2647058823529412` to `0.3932038834951457`. Accuracy is `2/3`; evidence remains direct but uncertain and unresolved, with no provisional gap.
- Follow-up: every case selects a fresh released question for the same target. The high-guess-space and contradictory cases use reason `confirmation`; the all-skip case remains on branch coverage. No case creates a lesson; each reports the missing check binding for the unresolved target.
- Exact evidence: `docs/diagnostic/revision-41-response-pattern-traces-2026-09-13.json`; test: `src/lib/diagnostic/granular/response-pattern-profile-trace.test.ts`; focused runner: `src/lib/diagnostic/granular/testing/response-pattern-trace.ts`; command: `scripts/run-revision-41-response-pattern-traces.mts`. Two report runs produced identical SHA-256 `5e13c6a1d38326cb3e9a14844687257829c876a88ec0112af8ae7c7f8ce1176b`.
- Validation: 30 tests passed across the response-pattern matrix plus skip, engine, discrimination, and learning-progress suites; repository TypeScript and focused ESLint passed. An explicitly missing revision-41 source cleanly skips all three artifact-bound tests.
- Limits: focused synthetic traces only. They do not establish a complete 35-minute sitting, actual student guessing, post-lesson refinement, pause/resume retention, mastery, calibration, or deployed behavior.

### Next 35-minute mixed-profile allocation

P2.09 must first add the guided-success and independent post-lesson counterexamples. P2.10 can then use one 2,100-active-second budget in which all released branches compete through the real selector. The runner must record the selector's actual allocation without assigning per-domain quotas or forcing a branch sequence.

The mixed profile must explicitly exercise currently untested reverse outcomes for present `être` versus `avoir`, present versus imparfait `aller`, relative versus completive production, `on/om` versus `m` before `m/b/p`, and explicit-location versus local-cause reading. It must also add the still-untested released agreement distinction `accorder_participe_etre::writing-controlled-production::construction:feminine` versus `accorder_participe_etre::writing-controlled-production::construction:plural`. Any target that the competing selector does not reach within 2,100 active seconds must remain listed as unresolved/untested; it cannot be omitted from the declared profile or counted as a passed contrast. A separate deployed P2.10 journey remains coordinator-owned.

Next atomic task: P2.09, replay guided lesson success followed by independent same-target evidence, including a guided-only counterexample that cannot confirm mastery.

## 2026-09-13 — P2.09 learning-driven refinement

- Status: engine behavior validated against the frozen revision-41 artifact; delivery remains blocked because the exact independent-check binding is draft.
- Exact target: `orthographier_nasale_on_om::writing-controlled-production`, chosen because it has no prerequisites, a published instruction, six guided exercises, and seven separately reserved learning questions.
- Initial evidence: three released incorrect questions consume 90 active seconds and produce probability `0.00793650793650794`, a provisional gap, and published instruction `022a81f0-29de-5fc4-971c-a2e2240f9955` / `french-v3-teaching:on-om:production`.
- Guided-only counterexample: all six guided exercises are recorded as correct, but the teaching path contributes zero assessment observations. The target remains uncertain and unresolved at the same probability and provisional gap. Completing the lesson therefore does not confirm mastery.
- Independent refinement: after three correct reserved checks on `learning-day:2026-09-14`, probability is `0.8536299765807963`, but the target remains uncertain and unresolved because only one new occasion exists and the `.5` response space has not passed the chance-of-streak gate. Four more correct checks on `learning-day:2026-09-15` bring the exact target to probability `0.9839285148569438`, seven distinct questions and contexts, and two later occasions; only then does the existing rule report that target mastered/resolved.
- Delivery blocker: independent-check binding `0695008f-8cca-52d9-8baa-964b80988d54` is `draft`, so the seven-question refinement is a technical replay over released reserved probes and is not currently deliverable. After guided completion the plan reports the missing check and does not substitute another activity.
- Exact evidence: `docs/diagnostic/revision-41-learning-refinement-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/learning-refinement-profile-trace.test.ts`; runner: `src/lib/diagnostic/granular/testing/learning-refinement-trace.ts`; command: `scripts/run-revision-41-learning-refinement-trace.mts`. Two report runs produced identical SHA-256 `28e6935491c7c95da2ea8709c47107be91f58e21d50aa243ffa969a9ed197700`.
- Limits: the final mastered state belongs only to this exact synthetic target after two later occasions. It does not establish mastery of any other target, a deployable check, persistence, calibration, owner review, or a live journey.

## 2026-09-13 — 2,100-second mixed-profile preparation for P2.10

- Status: technical full-budget trace prepared; it exposes unmet coverage and does not satisfy the coordinator-owned deployed-journey gate.
- Inputs: twelve declared reverse-outcome targets spanning individual verbs, tense, `être` participle agreement, grammar constructions, spelling, and short reading. All other non-writing questions receive a fixed correct answer; independent-production questions would be skipped because this runner has no trusted evaluator.
- Allocation: the unchanged production selector asks 61 questions in exactly 2,100 active seconds. Measured domain allocation is conjugation 18 questions / 540 seconds, grammar 17 / 510, reading comprehension 9 / 540, and spelling 17 / 510. No domain quota or forced branch sequence exists in the runner.
- Released-scope coverage: 25 of 360 released assessment targets receive direct evidence; 335 remain explicitly `untested`. Eleven targets resolve only for within-sitting routing. Officially resolved targets remain zero because this is one occasion.
- Declared outcomes reached: present `avoir` known (3 questions), present `aller` weak (3), completive production known (4), and `m` before `m/b/p` production known (7) resolve within the sitting while staying officially uncertain.
- Declared outcomes unmet: present `être` weak, imparfait `aller` known, feminine and plural `être` participle agreement, relative production weak, `on/om` production weak, explicit-location narrative reading weak, and local-cause narrative reading known each receive zero questions and remain unknown/untested. They are retained in `unmetDeclaredTargetIds`; none counts as a passed contrast.
- Follow-up result: no activity is returned. All 360 scoped targets are blocked by unresolved prerequisite or availability state and 52 lack the activity needed for their current action. This reverse profile therefore does not yet demonstrate the suitable-activity part of P2.10.
- Exact evidence: `docs/diagnostic/revision-41-mixed-profile-trace-2026-09-13.json`; test: `src/lib/diagnostic/granular/mixed-profile-trace.test.ts`; runners: `src/lib/diagnostic/granular/testing/mixed-profile-trace.ts` and `src/lib/diagnostic/granular/testing/revision-41-mixed-profile.ts`; command: `scripts/run-revision-41-mixed-profile-trace.mts`. Two report runs produced identical SHA-256 `911c2a1123f173094697ee965fb91237e6b5ea67399c072149329e53b332030f`.
- Validation: 30 focused tests passed across learning refinement, mixed allocation, learning provenance, provisional teaching, teaching service, occasions, and discrimination; repository TypeScript and focused ESLint passed. Missing-artifact execution cleanly skips all four new artifact-bound tests.
- Limits: synthetic fixed responses only. The trace does not test pause/resume, persistence, trusted independent-writing evaluation, browser delivery, calibration, or deployment.

Next atomic task: diagnose whether P2.10 should narrow its declared learner profile to targets the 35-minute production selector can actually reach, or change production allocation with a separately reviewed engine fix. The deployed pause/resume journey remains coordinator-owned.
