# Expanded diagnostic and writing release on production

The verified deployment is live at https://app.trouvetaplume.com. New diagnostic sessions use `french-granular-diagnostic-v33-writing`; existing sessions remain pinned to their saved releases. The production project settings also pin this release and enable the writing evaluator for subsequent deployments.

The release serves 327 of the approved graph’s 542 evidence targets, with 6,168 available questions. Its canonical parent bank contains 7,554 individually verified relational records. The recent additions cover pronoun order, tense meaning, noun/determiner/adjective agreement, subject–verb agreement and infinitive/participle distinctions, alongside connected-writing activities.

The writing flow now returns source-bound feedback, persists it across reloads, and lets a student continue when the submitted text offers no evidence for the targeted skill. Unassessable submissions are saved without an incorrect grade or mastery evidence.

Verification used the real evaluator through authenticated deployed browser submissions for correct, incorrect and unresolved writing. All three cases persisted and reloaded correctly; the rendered feedback was inspected at phone width. The writing starting state was a declared QA fixture with no diagnostic scores, so this proves the writing transport and persistence flow, not a natural complete diagnostic-to-writing journey. Separate real-provider service tests covered six cases and 12 individual opportunities.

The public domain retained the writing feedback and offered five lesson/check links for the QA profile. The demo still opens its first lesson and retains 11 lessons and all 48 diagnostic answers, including 17 incorrect answers. No demo reset or result migration occurred.

Remaining work includes the unserved graph targets, complete material-exposure histories, full diagnostic-to-writing routing checks, and ongoing educator review and classroom calibration. No human approval or complete exposure history was fabricated by this rollout.

See the adjacent JSON report for deployment and immutable release identifiers, checksums, synthetic answers and exact observed feedback.
