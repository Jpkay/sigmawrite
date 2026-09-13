# Evidence counts beside provisional skill results

Source `773d3f7` adds a per-mode success count to the diagnostic result and progress views. For example, an uncertain skill can now show two successful answers out of three rather than only a total count and “À confirmer”. The helper uses the engine's eligible evidence and current evidence window. It does not recount all historical diagnostic answers or change inference, recommendations or mastery thresholds.

Counts exclude assisted and duplicate observations through the existing engine. Free-writing accuracy is deliberately excluded because it measures language opportunities rather than whole correct texts. Invalid or non-integral reconstructed counts are omitted, not rounded into invented answers. Both the fixed explanation and dynamic display strings are included in delivery recording.

Validation: 436 files / 1,856 tests passed, including real component rendering for mixed and successful answers, exclusion of assisted and repeated answers, untested skills and free writing. TypeScript passed. The candidate browser check compared the displayed counts for all 19 skills with eligible answer evidence against the saved release and session. It also verified the 60-answer review, lesson page, home, progress, recording, worker registration and mobile width, without changing the assessment.

The full graph remains at 360 of 544 supported targets. Displaying successful answers does not certify mastery or resolve incomplete material history. Real-student and teacher comparison remains part of the pilot roadmap.

The older extra demo browser check was stopped after it remained running without producing a result. It is not counted as a pass; its script submitted no diagnostic or lesson answers. The dedicated technical-account checks are recorded separately.

Deployment `dpl_H5Y1JqcrviYMhQP9kzNw4a6H5gKU` was promoted and the canonical alias inspected as Ready. Public checks passed at `https://app.trouvetaplume.com`, including per-skill count comparisons on both results and progress, with 19 skills verified, no page errors and unchanged assessment state. See the accompanying rollout JSON.
