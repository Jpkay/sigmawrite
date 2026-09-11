# Expanding the French diagnostic without changing previous answers

The first published bank remains `french-diagnostic-bank-v3`. Later question or review revisions use a new bank key such as `french-diagnostic-bank-v3-r2`, a new unique bank version, and a new assessment release key. Published questions, answer keys, bundle checksums, and review provenance remain immutable. Correcting or reviewing content does not authorize rewriting the version a student answered.

The publication path accepts only this explicitly numbered French v3 family, still pinned to the approved French taxonomy checksum. Each new bank must pass the same exact relational question/choice checks, scoped instruction and fresh-question checks, and checksum-bound publication permission. Legacy v2 and unrelated bank keys cannot use that permission path.

`GRANULAR_DIAGNOSTIC_RELEASE_KEY` selects the default assessment release for students who have no granular session. Its fallback is `french-granular-diagnostic-v1`. Existing students resume their latest available published session and its original bundle, even when the default changes. A failed database read must fail visibly rather than silently start another assessment.

Migration `20260911095103_granular_bank_revisions.sql` was applied to production after a disposable full-schema test passed 149 application migrations. The SQL fixture publishes both the original bank and a second revision and repeats the answer-key, permission, rollback, idempotency, and approval-preservation checks for the revision. This migration does not expand the currently available question coverage or activate another assessment release.

## Building a numbered revision

The authoring, parallel-review, scope, preflight and publisher scripts now accept `--bank-revision 1` (or another positive integer). Pass the same number throughout. This derives a distinct bank key and version from the original French v3 base, recalculates the manifest, and preserves each item's own review status and provenance. It does not edit the published parent bank.

Prepare a revision in a separate checkout so its generated preparation files remain associated with that source commit:

```sh
npx tsx scripts/assemble-v3-review-candidate.mts --bank-revision 1
npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 1
npx tsx scripts/build-scoped-review-candidate.mts --bank-revision 1
npx tsx scripts/prepare-scoped-publication.mts --bank-revision 1
npx tsx scripts/verify-scoped-command-journey.mts --bank-revision 1
node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts export-bank /tmp/french-v3-r1.json --bank-revision 1
```

After importing the exact exported bank using the existing importer, run the publisher's `check` and `publish <new-release-key>` commands with the same flag. The publisher rechecks the candidate, parent identities and relational contents. A new source expansion cannot overwrite an existing bank through this workflow: its changed checksum fails the parent check. Activation still uses the explicit release-key setting, and existing students retain their saved release.
