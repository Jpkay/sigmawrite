# Prepared atomic material delivery

A shared prepared-delivery function now accepts server-assembled presentation identities and the complete display payload. It validates batch ownership before writing. With an explicitly supplied trusted capture contract, it uses the existing single database operation for both text and presentations; failure cannot fall back to ordinary writes. Without a contract, existing conservative receipt/journal behavior remains.

The answer-review service assembles its stable correction identities first and can use this atomic path. Its authenticated action does not accept or supply a capture contract. Server-rendered interface payload helpers can also use the operation with no fabricated question presentations. Their default remains ordinary capture, and an unconfigured local backend cannot claim covered delivery.

No runtime caller enables a contract, no old baseline is created, and no database migration is applied to production by this change. The remaining delivery inventory and deployed fresh-student proof are still required before complete-history activation.

Verification: 35 focused tests pass, including unchanged review responses, deterministic retry identities, ownership rejection before writes, atomic failure without fallback, authenticated interface-only capture, and unconfigured-backend rejection. TypeScript passes. The isolated PostgreSQL coverage suite passes, including rollback, retry, source/owner isolation and concurrent untracked-delivery invalidation. Both concurrency checks observed the locking behavior and retained unverified evidence. These are local database fixtures, not production baseline certification.

The full two-worker regression run passes: 414 test files, 1,811 tests. No test thresholds or assertions were relaxed.
