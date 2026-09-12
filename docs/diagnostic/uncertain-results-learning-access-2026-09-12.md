# Learning access while results remain uncertain

## Observed behavior

On the published r34 candidate, the live technical diagnostic had 17 saved answers at 2026-09-12T11:34:12Z. A read-only calculation from its pinned bundle and saved observations produced ten independent-check activities and no instruction. Nine skills had eligible evidence; no observation had a complete-history receipt. This is an intermediate snapshot, not the final diagnostic outcome.

The implementation in `engine.ts` excludes observations without verified novelty when the skill requires new words or sentences. `pathway.ts` chooses teaching only for demonstrated gaps or sufficiently supported provisional gaps. `activity-plan.ts` offers independent checks for other uncertain results, and `teaching-service.ts` only opens lessons present in that plan. These rules can therefore leave students with repeated checks before teaching becomes available. The timed live journey is still running and must establish its actual final behavior.

## Required behavior

The owner's decision is to start learning after 30–40 active minutes and refine unresolved skills during learning. Access to a suitable explanation must not depend on first proving failure. Conversely, choosing or completing a lesson must not convert uncertainty into a diagnosis or mastery.

## Implementation direction

Add a clearly separate, optional lesson choice alongside the evidence-based next checks:

- Use exact-target, published lessons from the student's pinned release and supported teaching scope.
- Keep prerequisite readiness checks; begin with appropriate foundations when prerequisites are unresolved.
- Explain the choice in French as reviewing or discovering the topic, without saying the student failed it.
- Preserve current skill probabilities, statuses, and evidence requirements. Do not fabricate complete history or relax novelty requirements to make lessons appear.
- Keep independent checks available and reserve fresh assessment material. Record all lesson exposure before delivery; guided practice remains separate from mastery evidence.
- Authorize the optional lesson server-side using the same owner and release checks as recommended teaching. A browser-supplied activity ID is insufficient.
- After lesson completion, offer fresh independent checks and keep unresolved results explicit.

## Verification required before release

Cover absent history, fully untested foundations, mixed correct/incorrect answers, prerequisite blocking, completed lessons, exhausted checks, unsupported/draft content, and forged cross-student activity IDs. Verify that optional lesson access never changes diagnostic evidence on its own. Run a real post-diagnostic lesson and independent check, including reload, on the candidate. This note is a proposed implementation requirement, not evidence that this behavior is implemented or deployed.
