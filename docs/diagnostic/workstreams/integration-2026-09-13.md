# Integration and repository cleanup — 13 September 2026

Coordinator owns commits, pushes, immutable release preparation, deployment,
public verification, and the shared roadmap. Four GPT-5.6 SOL agents with High
reasoning have bounded ownership: adaptive selection, material delivery,
passage review automation, and the existing marketing/admin changes. Agents
report verified pieces before continuing dependent work; they do not publish.

## Starting evidence

- Branch `develop`, source `3ab81a4`; 34 modified tracked files at intake.
- Public `sigmawrite.vercel.app` resolves to deployment
  `dpl_5Dsg1ZzaYkieT7Kaper26svvvJny` (R41 baseline).
- R42 candidate `dpl_HnYDpWUnR6CHnj1tK6RnxgNXwYaS` is Ready, with prior
  production-task and result-display browser evidence in local QA artifacts.
- R42 import completed as draft with 8,052 canonical items. Approved-only
  validation is false. The owner-authorized parallel-review publisher is the
  applicable path; approval counts must not be fabricated to bypass this state.
- R43 frozen candidate build/reproduction passed with 367 supported targets,
  6,663 scoped questions, and no instruction or fresh-check gaps. Its focused
  suite passed 42 tests. It has no verified public release recorded at intake.

## Commit and release order

1. Preserve local QA artifacts through explicit ignore rules; record this audit.
2. Verify and commit existing source batches, with their tests and dependencies.
3. Complete bounded adaptive/material slices and update their roadmap evidence.
4. Build from committed source, check database compatibility and candidate
   behavior, promote the verified release, then check the public application.
5. Record deployment IDs, source commits, content checksums, and remaining gaps.

Local logs, temporary auth fixtures, generated PDFs, and workstation helper
scripts remain on disk. They are excluded from Git and deployment uploads.
Source generators, migrations, reusable tests, and sanitized evidence remain
eligible for review and commits. A clean status does not imply deletion of local
work or completion of the full 544-target roadmap.

Real owner review and real-student observation remain separate pending tasks.

## Final integration checkpoint

- R42 and R43 were published through the existing parallel-review contract,
  runtime-exported and verified before candidate promotion. R43 supports
  367/544 targets with 6,663 scoped questions and 8,088 exact bank items.
- Application source `8488125` integrates dictation and legacy diagnostic
  capture, within-skill authored-tier routing, schools/admin marketing changes,
  and guarded review automation. All delegated work is stopped after handoff.
- Main suite: 469 files / 1,978 tests passed with four workers. A concurrent
  build/test run timed out three expensive tests; the unchanged suite passed
  when rerun without competing build work. No timeouts or assertions were weakened.
- Detached clean checkout: 1,968 tests passed; 10 private-export-dependent tests
  skipped. These ten passed in the main checkout with the validated exports.
  Dependency install, TypeScript and production build passed; audit found zero
  vulnerabilities. Main lint has zero errors and 11 pre-existing warnings.
- Native PostgreSQL: 162 migrations, 47 review assertions, 11 school-inquiry
  assertions, persistence/access checks and concurrent-exposure/learning checks
  passed. Only forward migrations `20260913110000` and `20260913111000` were
  applied remotely, atomically with their ledger entries. The active 5/10/100
  policy, evaluator, calibration and three configured reviewers are unchanged.
  Two reviewers remain eligible; the preserved one-eligible-reviewer rule passes.
- Complete-history migration `20260912130000` remains unapplied. No human review,
  independent learner success, or real-student observation was fabricated.
- Follow-up: the matching `TURNSTILE_SECRET_KEY` is now saved as a Production-only
  Vercel secret. The existing Cloudflare widget was not rotated or modified.
  Source `8488125` was rebuilt as `dpl_G6zc25UMJwHzMixpNi4KAWEsqApc`; build,
  TypeScript, production alias and public HTTP checks passed. The live school
  form shows automatic Turnstile success. No inquiry or notification email was
  submitted; server-side Siteverify and email delivery still need an authorized
  end-to-end test. See `turnstile-production-rollout-2026-09-13.json`.
- A disk-full isolated install was recovered by removing only this session's
  disposable `node_modules` and `.next` directories. Source and QA evidence were
  preserved; these dependency/build artifacts are reproducible. Local fixture
  servers were stopped after their browser checks.

Deployment IDs and final hosted evidence are maintained in the release report
and the atomic roadmap; the application-source commit is distinct from later
documentation/verifier-only commits.
