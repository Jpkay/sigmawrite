# Student safety checks

Run these checks after any change to student input, AI providers, authentication,
or RLS. Use local Supabase first, then the dedicated staging project.

## Automated coverage

- `src/lib/safety/moderate-input.test.ts`: clean French response, fallback
  unsafe/contact/prompt-injection rules, provider routing, and invalid-provider
  fallback.
- `src/lib/ai/pipeline.test.ts`: sensitive generated topics and failed
  moderation always require human review.
- `npm run ci`: TypeScript, ESLint, and the full unit suite.

## Database and browser checks

1. Submit a reading summary containing a fallback safety phrase. Expect the
   neutral student message and no `student_summaries` row for the session.
2. Inspect the newest `student.free_text_rejected` audit entry. It may contain
   only field name, categories, moderation source, and character count—never
   the answer itself.
3. Replace it with a clean summary. Expect the same text to persist unchanged
   and the reading flow to continue.
4. Call `consume_auth_attempt` eleven times for one SHA-256 subject. Attempts
   1–10 pass and 11 is throttled for the remainder of the 15-minute window.
5. Call `consume_student_action('submit_answer')` 61 times. Calls 1–60 pass and
   61 returns a retry delay.
6. Consume 101 daily AI units. Units 1–100 pass and 101 is denied; a student
   cannot consume another student's budget.
7. Re-run the cross-student evidence test: student A cannot read or write
   student B's session, summary, answer, retrieval, or budget rows.

## Verified 2026-07-10

Local verification passed all checks above. The flagged summary produced zero
summary rows, one category-only audit entry, and no verbatim match in audit
metadata. A clean replacement persisted and advanced to retrieval. Dedicated
staging verification repeats the counter, persistence, audit, and RLS checks
after migration application.
