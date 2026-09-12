# Older writing feedback delivery capture

Prepared change, not yet deployed. No capture-completeness contract enabled.

The older reading-summary flow now records the rubric returned by initial submission, the complete feedback returned by a revision, saved feedback history including teacher comments, and texts delivered by the printable collection. Capture uses the authenticated student owner.

Revision lookups use a private database reader instead of calling the public feedback action. Internal grading and history reads are not recorded as separate student deliveries. The evaluator captures only the selected returned payload, before saving the evaluation or updating competency evidence. If capture fails, a new revision is not consumed; the same revised text can be submitted again. Existing histories are not backfilled or declared complete.

Validation: 364 test files / 1,624 tests passed; TypeScript passed. Seven action tests exercise saved feedback, teacher comments, ownership filtering, exact rubric-only delivery, revision capture before persistence, retry after capture failure, withholding failed reads, collection delivery and unauthorized access. Tests use deterministic evaluator and database doubles; they are not deployed browser or provider validation.

Remaining capture work includes other alternate/static sources, practice feedback returned after server validation, audio source coverage and a verified fresh-student baseline. These changes alone do not certify novelty or resolve the production eligibility gap for novelty-required skills.

Subsequent deployment and live verification: [capture follow-up rollout](capture-followup-rollout-2026-09-12.md).
