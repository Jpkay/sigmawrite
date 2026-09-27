# Onboarding display-copy capture

The onboarding route now records its fixed display payload on the authenticated server before returning the interactive client. The client uses this same payload for headings, grade and background labels, exposure checkboxes, interests, completion/error wording and the remaining-interest count.

The display record excludes routing keys, interest transfer metadata and the student's profile or choices. Existing selection keys, grade values, home/school multi-selection and completed-diagnostic redirect behavior are retained. The count now uses singular/plural wording rather than `sujet(s)`.

The record conservatively covers both steps' delivered copy, including states that may not be painted. It does not claim that the student read each string. No complete-history contract or retrospective coverage is enabled. Shared browser widgets, external errors and other routes remain separate capture surfaces.

Focused capture tests and TypeScript pass. All 402 test files and 1,778 tests pass. Deployed interaction verification passes on source 31d5893: all 38 interests, simultaneous home/school selection, three-interest minimum, back navigation and mobile width. The paused account was not submitted and its diagnostic state remains unchanged. Source 31d5893 is now public. The public onboarding interaction and copy-journal check pass; the paused diagnostic is unchanged.
