# Capture student-state deliveries after activities

Prepared application change; not yet deployed.

The initial state action already journaled its response, but seven additional return paths read the database state without recording the material delivered to the student. These include onboarding completion, returning an existing legacy diagnostic, finalizing that diagnostic, reading completion (normal and replay), memory retrieval and skill practice. The snapshots contain memory-card prompts, keywords and vocabulary as well as progress information.

All eight state reads in the student action module now use one server-only delivery reader. It reads the current snapshot and journals it under the authenticated student before returning. Teacher, parent and report reads retain the raw database reader because those are not deliveries to the student. Granular action responses already journal their whole payload and are unchanged.

Verification: the full suite passed 362 files / 1,613 tests and TypeScript passed after the implementation and reader tests. Four subsequent action-boundary tests passed separately. Tests cover fresh changed snapshots, separate owners, forwarding the database client, failed reads, withholding delivery on journal failure, retrying a read, initial-load and existing-diagnostic integration, and authorization failure before reading. This does not establish that retrying every mutation is idempotent; delivery failures after mutation still require the existing recovery semantics of that action.

No histories, diagnostic results, mastery states, capture contracts or demo data were changed. This records delivered text, not attention or a complete exposure history. Static and alternate routes, audio coverage, audited baselines and full production learning journeys remain required before enabling the completeness contract.
