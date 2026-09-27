# Home dashboard delivery capture

The home route now records shared fixed wording on the server before returning its client component. Loading, onboarding, diagnostic-required and normal dashboard states render those supplied strings. The existing client behavior, recommendation loading and owner-bound offline prefetch remain in the client component.

The home aggregation action now authorizes the whole request before starting optional reads, then records the final assembled payload before returning it. Individual unavailable sections still become null; failure to record the final response is not swallowed by that degradation mechanism. The returned home response shape is unchanged.

Plan counts, durations, plan-entry descriptions, streaks, XP, daily goal text and reading-band labels use shared formatters. The initial zero/default wording is included with fixed page copy. Server capture mirrors the client's six-entry primary-plan limit and three-entry fallback-plan limit, including the difference between an empty plan and an unavailable one.

## Remaining home coverage

This is not complete home-page exposure coverage. Motivation/badge/league/class-goal/recap and assignment components still require their own rendered-text audit. The initial seed recommendation selected by the client from hydrated interests must be captured from the same selection before it appears; recording only the later home response does not prove that initial fallback was covered. Existing cached client code is not backfilled or declared verified. No capture contract is enabled.

TypeScript and the complete two-worker suite pass: 419 files, 1,822 tests. Focused checks cover rendering across home states, deferred page recording, final-response recording failure, authorization before optional reads and matching plan limits. The initial asynchronous-failure fixture was corrected to behave like a Supabase thenable rather than throwing synchronously while constructing queries; the resulting run has no unhandled errors. No deployment is claimed for this batch. The independent review-status edit in student actions is not part of this commit.
