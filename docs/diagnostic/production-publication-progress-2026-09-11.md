# Granular diagnostic production rollout — 11 September 2026

The approved French taxonomy is published in production as `403c4318-51db-43a5-86d6-cac4a0cfbe61`, with checksum `sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880`.

Applied migrations 0141–0144 and 0146–0149 together in one transaction, with exact source statements recorded in the migration ledger. Migration 0145 was already applied. A subsequent production query verified all nine ledger entries. Publication RPC execution is denied to anonymous and authenticated student roles and granted to the service role. The production security advisor reported no error-level issues before or after this change.

Validation before applying: the disposable full-schema PostgreSQL run passed 148 application migrations, persistence/access checks, full graph engine-state persistence, material exposure checks, and lesson annotation invalidation. The granular suite passed 396 tests across 107 files. Type checking and explicit lint checks passed for the operator/import scripts.

The exact 4,070-question bank was exported with checksum `sha256:f29362f32b8562bc8f310b6504fa1891c73488e0313444c4018617a7fe62967c`. Both canonical reviewer profiles exist in production. The importer now rejects missing granular review provenance before writes, paginates membership reconciliation, and compares review timestamps as instants.

At this checkpoint, the import is running and the bank is unpublished. No granular release has been activated. Finish the import, run the read-only operator check against all relational questions and choices, publish the verified bundle, deploy the runtime, and verify the complete student journey before activation. The 52-target initial scope does not complete the broader granular graph implementation.

## Runtime deployment checkpoint

Runtime commit `226fd1e` contains the granular engine, teaching/check flows, scoped release artifacts, and reproducible question sources. An isolated Git snapshot passed 1,202 tests across 241 files, type checking, and a production build. Follow-up commit `997fae0` preserves completed legacy results when the granular feature switch is enabled; two focused selection tests plus type checking and lint passed.

Production deployment `dpl_8C9C9SLAuGYfUzr9bC4XSS7mXR3M` (`https://sigmawrite-prr1q7cxz-jpkays-projects.vercel.app`) is ready. The granular feature is not yet activated. A separate headless Chrome verification on the app domain retained the demo's completed home state and “Mes leçons” navigation. Import progress at this checkpoint is 3,136 of 4,070 memberships in bank `b19513f6-9d28-4786-94dc-d8c415957b2d`; the existing import process is still live and must not be restarted merely because a tool observation times out.

## Bank verification and publication

The import completed with all 4,070 memberships and zero missing reviewer records. The operator verified every relational question and choice against the canonical artifact. See `production-bank-verification-2026-09-11.json` for the exact checksums and the 52-target initial scope, with no instruction or fresh-check gaps within that scope.

Published release `3e719c94-3bd0-43db-b745-0b52952eb7a5`, key `french-granular-diagnostic-v1`, bundle checksum `sha256:112c792d5ceae1707980fa86169b0d7cfaca6d51a7e71746ebf6932f27a9202a`. The publisher loaded the persisted bundle again and revalidated it. Production counts remain 205 human-approved, 33 auto-approved, and 3,832 needing human review; publication did not manufacture approvals.

Enabled verification deployment `dpl_DbpaNHag2ZuXXbNv4SpgCMKVc2Kj` is available at `https://sigmawrite-ldrk8srmv-jpkays-projects.vercel.app` without promoting public domains. Synthetic account `doves.granular.qa` (student `67ca511b-e459-4139-9adb-ce0d2d11c483`) is being used for a real-clock browser journey, separate from the teacher demo. Automated deployment access uses a temporary Vercel protection-bypass secret kept outside the repository; revoke that task-specific secret after verification. Public activation is still pending the completed journey.
