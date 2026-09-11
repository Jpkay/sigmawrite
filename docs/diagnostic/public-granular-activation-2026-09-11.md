# Initial granular diagnostic activated

Production deployment `dpl_CkaTyqsN2qDfRGNsEFd35nkq2n9V`, source commit `9e1e1cf`, is promoted to the public app. The production environment now persists `GRANULAR_DIAGNOSTIC_ENABLED=true`. The default assessment remains `french-granular-diagnostic-v1`, bound to the original immutable French v3 bank and approved taxonomy.

A synthetic student's live browser assessment completed with 45 answers, 15 correct and 30 incorrect, after 2,071.338 active seconds. Pause and reload preserved the remaining time. Answers sampled 15 targets; ten had usable direct evidence under the release's evidence rules. A 542-skill map is not a claim that 542 skills were assessed. This initial release supports 52 assessment/teaching targets and 745 questions; unsupported and unresolved skills remain explicitly unverified.

The student then completed all four guided exercises in the lesson about inferring a word from an example or contrast. A fresh, unaided question on that same skill saved a refinement. Guided practice did not change the diagnostic observations. Results and progress survived reload.

Verification uncovered an activity-link replay bug: the launch parameter remained in the URL, allowing a completed check to restart on reload. The client now consumes a matching launch parameter once and ignores stale activity props restored from browser history. A subsequent browser test completed an existing check, opened and answered a new check through its link, and reloaded twice without another activity starting. Eleven targeted tests, type checking and lint passed for the repair.

Final public-domain checks confirmed:

- The granular test student reaches its saved results and five available activities.
- Opening onboarding redirects to lessons after completion.
- The mobile results page fits a 390-pixel viewport without horizontal overflow.
- The legacy `doves.demo` account still redirects to its lesson list.

The task-specific deployment bypass was revoked after verification. Synthetic-account results are technical test evidence, not student outcome or calibration data. Full graph coverage, broader lesson authoring and parallel human review remain unfinished. The next 66-target revision is separately prepared and importing; it has not replaced this release.

Machine-readable verification: `live-granular-verification-2026-09-11.json`.
