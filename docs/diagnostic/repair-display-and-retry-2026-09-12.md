# Remedial lesson display and retry

The final answer is no longer cleared before saving. A rejected save leaves its correction and finish button available; retry sends the same answer list instead of making the student answer again and extending that list. Backend sessions no longer apply a local skill update before the server replies. Offline-only behavior retains its local update.

The route also records shared fixed copy, exercise-position labels, possible final scores and the completion sentence alongside the already-recorded lesson. Local Chrome with the actual component completes its questions, rejects the first final save, retries and verifies identical request payloads and one acknowledged state replacement. This is not a production save test.

TypeScript passes; 433 files and 1,847 tests pass. Not yet deployed. A separate outstanding issue remains: the legacy server action has no durable submission identity, so a retry after an uncertain response could apply an estimate update twice. This browser fix does not claim server-side idempotency. That requirement is now explicit in the route checklist.
