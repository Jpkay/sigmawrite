# Writing results display fixes

The older summary-feedback UI now reads the nested rubric dimensions produced by the evaluator instead of looking for nonexistent top-level fields. Missing dimensions remain explicitly “Non évalué”. It initializes the revision editor from the latest saved submission, disables blank or unchanged submissions (including whitespace-only changes), and disables editing during submission. Switching reading texts remounts the editor; obsolete feedback loads are ignored after unmount.

Source `af6d857c2b3c0cc54dec2b4ba325162b93473ba8` is deployed at https://app.trouvetaplume.com as `dpl_ExsqauLrwaPgPBHMcCqWjFvwFVgU`. The active diagnostic release remains `french-granular-diagnostic-v33-writing`.

Candidate and public browser checks used the capture QA student's already saved first revision. Both displayed its database rubric values: content 85, structure 90 and language 95. The editor matched the saved revision before and after reload; unchanged and whitespace-only drafts could not be submitted, while a changed draft enabled submission. No new revision was submitted or consumed. The 390-pixel mobile page had no horizontal overflow and was visually inspected. No browser page errors occurred. The candidate demo retained 11 lessons, 48 diagnostic answers and 17 incorrect answers; its first lesson opened.

TypeScript, five focused test files (16 tests), and the deployment build passed. The canonical production alias was inspected and confirmed Ready. This fixes display and editor state; it does not alter grades, establish evaluator calibration, enable complete exposure history, or complete the remaining French graph work.
