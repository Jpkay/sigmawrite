# Practice correction and language-tip capture

Released to production on 2026-09-12. Application source: `3e7cc67`; deployment: `dpl_79zFrizpzVYDoQotio74vSjHE2V8`. The canonical production alias was inspected after promotion and resolves to this Ready deployment.

Practice validation can produce corrected forms absent from the original lesson payload. The submission action now records that feedback with its item reference before inserting the attempt or updating evidence. A journal failure therefore leaves that attempt unconsumed. This change does not yet capture every static feedback heading or later remediation label.

Optional language coaching records both newly generated and cached tips before returning them. The attempt query and service lookup are explicitly scoped to the authenticated student, and active access is checked before lookup. A generated tip may remain cached when delivery recording fails; a retry uses that cache and still must record the tip before delivery. Coaching does not change the saved grade.

Verification: 368 test files / 1,644 tests passed with four workers, and TypeScript passed after correcting a closure-narrowing issue. The six coaching tests were rerun on that final code and passed. Focused coverage includes generated and cached tips, capture failure and cache retry, owner filtering, active-access rejection, exact validator feedback, capture before attempt storage, no mastery writes on capture failure, and invalid-choice rejection. The practice ordering test deliberately stops at its storage boundary; it is not a full successful practice journey.

The capture-completeness contract remains disabled. Static and alternate sources, audio semantics, historical baselines, and the broader graph and review work remain incomplete.

## Live verification

On the deployment candidate, a test student submitted one reading reformulation with correct meaning but a subject–verb agreement error. Reading was marked correct. The optional grammar tip changed « Les racines des mangroves offre » to « Les racines des mangroves offrent », with the explanation « Accorde le verbe avec le sujet au pluriel. » Database verification matched the actual attempt and item, and the exact correction and explanation, to their delivery records. This verifies one exercise and its optional tip, not completion of the whole lesson. The repeat cached-tip path has unit coverage; the second browser click was not awaited and is not claimed as live cache verification.

Before promotion and again on https://app.trouvetaplume.com afterward, the demo account redirected from onboarding to lessons, displayed 11 lesson links, opened its first lesson introduction, and displayed 48 diagnostic answers including 17 incorrect answers. No browser page errors were logged. No demo answers were submitted.

The full granular diagnostic and graph objective remains incomplete. This release records more of what students receive; it does not establish complete exposure history or validate mastery conclusions.
