# Review and lesson-list display capture

The answer-review service now records shared interface wording and generated per-question headings/counts alongside the already-recorded questions, submitted answers and expected answers. The review component renders the same constants and formatters. Presentation receipt ordering, grades, original-session answer decoding and the returned response shape are unchanged. Missing-session navigation help is recorded by the authenticated page boundary before it is returned.

The lesson-list payload now includes its results/review links, optional-lesson instructions, open button, unavailable message and learning-upgrade prompt. The upgrade control renders the same shared wording. Existing activity descriptions and titles remain in the authenticated payload; the separate page-header recorder remains in place.

Checks: TypeScript passes; 11 focused tests across four files pass. They cover actual review rendering, expected/submitted answer capture, generated wording, unchanged return shape, wrong-owner/unfinished-session restrictions, failure to record, missing-session navigation, and the empty lesson list. No new full-suite run or deployed check is claimed for this batch.

These changes add exact delivered text; they do not enable complete-history coverage or certify every rendered route. The answer-review service still uses the conservative ordinary receipt/journal path, which invalidates unverified coverage. Atomic covered delivery, fresh-account baselines, the remaining route/action audit and a deployed eligible-evidence-to-recommended-lesson journey remain required before activation. No older student exposure or mastery state has been rewritten.
