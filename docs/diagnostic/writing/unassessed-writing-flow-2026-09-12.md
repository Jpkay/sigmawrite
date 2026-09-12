# Continue after an unassessable writing submission

Prepared, not deployed. Previously a provider judgment with no target opportunities returned an error and left the same question active. Now the server saves that submission separately from scoring observations, closes the check, and marks its question exposed. The student sees that the text was saved and the skill remains to be verified, then can continue the pathway.

Both versions of a revision are retained when applicable. No incorrect grade, mastery evidence, new independent occasion, or eligible-token count is invented. The saved text survives reload. Repeated submission cannot append another record. The browser still cannot supply this judgment: only the owned, current check and the server evaluator can trigger it.

Provider exceptions, unavailable evaluation and malformed evidence continue to preserve the active answer for retry. The feature uses the existing JSON session persistence; no migration or public activation was performed.

Verification: TypeScript passed; 361 test files / 1,609 tests passed. Focused checks cover unchanged skill results, question exposure, saved text, revision preservation, reload feedback, repeated submissions, unavailable providers and learner wording.

Live provider and deployed browser verification remain outstanding.
