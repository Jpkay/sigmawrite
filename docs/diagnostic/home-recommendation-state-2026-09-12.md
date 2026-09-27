# Home recommendation state and initial display

The dashboard now derives its initial reading card from the hydrated interests. Loaded recommendations belong to the interests that requested them. Changing interests discards the old result, including when interests change away and back before a request finishes. Late responses from an obsolete request are ignored. The authenticated student ID keys the dashboard so an account change remounts its local state.

The student-state delivery journal now records the selected initial card's title, difficulty label and two visible concepts. It does not record unseen passages or questions as part of this projection. The displayed card uses the same formatter.

Validation: the real home component in local Chrome reproduced the stale recommendation before the final fix. It now passes hydration, changing interests away and back, obsolete response rejection and account remount checks, without page errors. See `home-recommendation-browser-2026-09-12.json`. The fixture supplies controlled data; this is not production verification. TypeScript passes. Full suite: 420 files, 1,825 tests pass.

This batch is not yet deployed. It does not establish complete material history or prove the full recommended lesson journey. Remaining dashboard sections and version coverage still require the broader capture audit.
