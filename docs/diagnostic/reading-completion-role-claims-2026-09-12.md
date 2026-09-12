# Reading completion role compatibility

The capture QA student submitted five reading answers and a summary, but finishing the session did not create a completion claim. Inspection of the deployed function showed that `claim_reading_completion` still required the obsolete standalone `request.jwt.claim.role` setting. The matching finish and failure functions used the same check.

Migration `20260912121000_reading_completion_role_claims.sql` uses `auth.role()` for these three server-only functions. The workflow bodies and execution grants remain unchanged. Anonymous and authenticated student callers cannot execute the functions; a missing role remains denied. This does not change the at-most-once processing boundary or fabricate completion results.

The PostgreSQL 17 test first reproduced rejection with a modern JSON service-role claim, then exercised successful claim, denial of a duplicate processing claim, finalization, replay of the saved result, failure recording, missing-claim rejection and execution-grant isolation. The migration was applied to the linked production database. The original QA session is retained for the subsequent browser completion check.
