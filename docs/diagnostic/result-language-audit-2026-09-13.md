# Result wording audit — 2026-09-13

P1.04 reconciles existing implementation, rather than adding another result vocabulary.

- Diagnostic results explain that an unverified skill is not a weakness, and that questions are not yet available for every target.
- Unsupported results use “Questions à venir” in place of a weakness label.
- Recognition, controlled written response, comprehension and use in a personal text have separate student-facing labels.
- The progress view explains that each skill has its own result and recognition differs from use without help.
- `granular-frontier`, `frontier-view` and `result-groups`: six tests passed across three files. The candidate results/home/progress check preserves 60 saved answers, shows evidence on 19 eligible skills, and reports no browser errors.

Evidence: `src/components/diagnostic/diagnostic-copy.ts`, `src/components/diagnostic/granular-diagnostic.tsx`, `src/lib/diagnostic/granular/frontier-copy.ts`; candidate report is recorded with the atomic roadmap rollout. This verifies wording and separation, not student comprehension or calibrated educational accuracy. Teacher observation remains pending.
