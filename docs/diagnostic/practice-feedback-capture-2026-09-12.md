# Practice correction and language-tip capture

Prepared application change; deployed positive verification remains pending.

Practice validation can produce corrected forms absent from the original lesson payload. The submission action now records that feedback with its item reference before inserting the attempt or updating evidence. A journal failure therefore leaves that attempt unconsumed. This change does not yet capture every static feedback heading or later remediation label.

Optional language coaching records both newly generated and cached tips before returning them. The attempt query and service lookup are explicitly scoped to the authenticated student, and active access is checked before lookup. A generated tip may remain cached when delivery recording fails; a retry uses that cache and still must record the tip before delivery. Coaching does not change the saved grade.

Verification: 368 test files / 1,644 tests passed with four workers, and TypeScript passed after correcting a closure-narrowing issue. The six coaching tests were rerun on that final code and passed. Focused coverage includes generated and cached tips, capture failure and cache retry, owner filtering, active-access rejection, exact validator feedback, capture before attempt storage, no mastery writes on capture failure, and invalid-choice rejection. The practice ordering test deliberately stops at its storage boundary; it is not a full successful practice journey.

The capture-completeness contract remains disabled. Static and alternate sources, audio semantics, historical baselines, and the broader graph and review work remain incomplete.
