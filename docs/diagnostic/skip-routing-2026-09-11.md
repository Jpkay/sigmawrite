# Skips are not difficulty evidence

The previous selector deliberately tried an easier prerequisite after a skip, although it correctly left the score unknown. That routing policy is now changed: skipped questions still consume active time, exposure and branch-visit capacity, but only actual answers steer recovery, confirmation and boundary rechecks. A skip alone leaves the starting challenge intact; a skip after a successful answer does not turn that success into a reason to descend. All-skipped sessions still terminate and retain unresolved skills.

Validation: 512 granular tests across 148 files passed. New tests cover an advanced skip with no answer evidence and a successful answer followed by a skip; the session-level skip test now checks the intended unchanged challenge and a different question. TypeScript and source ESLint passed. This correction is committed separately from the active `4eeff57` runtime and has not been deployed.

The regenerated symbolic full-graph benchmark passes 8/10 depth checks and 2/8 discrimination checks both before and after this correction. The strict command therefore exits 1. This is a known remaining shortfall, not a successful comprehensive assessment. Its artificial probes and fixed timing do not establish pedagogical validity. The report is refreshed from the current engine; earlier passing-depth statements describe an older selector.

The live v10 QA journey is running on the unchanged deployed runtime with `--review`. It resumes the two existing QA answers and will verify every saved answer against the rendered review after results, teaching and an independent check. No historical answers are fabricated.
