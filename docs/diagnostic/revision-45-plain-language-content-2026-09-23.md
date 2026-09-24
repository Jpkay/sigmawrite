# Revision 45 plain-language diagnostic content

## Result

Revision 45 builds a new immutable bank, `french-diagnostic-bank-v3-r45`, while revision 44 remains available for existing sessions. The new bank contains 8,088 questions and has checksum `sha256:78e4bd8814ce109591af571a438288f8156c53ee73e3ac3e071bf1881ea4b978`.

Compared with revision 44, 5,672 bank items have revised student-facing copy. The scoped candidate uses 4,970 of those items. Question identity, skill and evidence bindings, response type, validator, and controlled or short-answer keys remain fixed. Multiple-choice rewrites keep one distinct correct choice and its index. The copy gives a time cue, a short example, or a concrete action in place of a grammar label when that label is not itself what the question assesses. It also simplifies guided practice, lesson titles, assessment labels, and shared diagnostic result screens.

The diagnostic still asks students to **use** verb forms and grammar in several formats. Its route policy samples present, past, and future verb forms, sentence structure, agreement, and reading evidence. An earlier 60-question route simulation reached verb-use and grammar-use questions in all-correct, mixed, and all-wrong profiles; the route policy and question IDs have not changed in this copy pass.

## Scoped candidate and known exclusions

The scoped candidate has 367 assessment targets, 367 teaching targets, and 6,662 questions. Its checksum is `sha256:a57dc1481f8a34f1852570ffb88f1f15795e4be4f87ec448a66d5245ec9aea8c`. Publication preflight reports zero missing instruction targets and zero fresh-check gaps.

Three old probes remain outside the scoped candidate:

- `local-conjugation-gap-v1:distinguer_personne_nombre:receptive:foundation` asks for person-number labels; 24 sentence-based questions remain for that evidence target.
- `review-draft-v1:reconnaitre_imparfait:receptive:core` and `review-draft-v1:reconnaitre_imparfait:receptive:stretch` contain duplicate choices with conflicting correctness; 12 other active probes remain for each level.

These exclusions remove no verb or grammar evidence target.

## Jev review

Jev is used to flag wording that may need work, rather than to certify a French grade level. On a varied 91-instruction sample from the final bank and guided practice, it marked 60 pass, 31 review, and 0 likely rewrite. The 31 review flags include dense but necessary examples and a few grammar distinctions; these remain candidates for later learner-led improvement. A separate audit of 134 shared diagnostic UI strings improved from 81 to 98 pass, with zero likely rewrite after the UI edits.

## Verification

- Focused revision 45 copy tests assert 1,147 residual family rewrites and preserve identity, answer keys, validator behavior, assessed material, and one correct multiple-choice option.
- Revision 45 assembly, parallel candidate, scoped candidate, publication preflight, and command journey generation succeeded on the final source.
- Focused tests and TypeScript compilation passed. The final artifact reproducibility checks and deployment verification are recorded with the release operation.
- Jev flags are a fast filter. No real learner reading test or session-replay validation has been completed for this revision.
