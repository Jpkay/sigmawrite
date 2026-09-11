# Live diagnostic-to-learning verification

`scripts/verify-live-granular-journey.mts` operates an existing technical QA student through Playwright on an HTTPS deployment. It uses the managed account provisioner's private JSON file to authenticate without sending email. Do not use a real learner's account. It preserves previous answers and any paused session, then submits a deliberately mixed continuation: compound-form answers are wrong and every fifth other answer is wrong. This is a functional test profile, not a calibrated learner model.

The runner spends real browser time on questions, lets the application's heartbeat enforce the time budget, and checks persisted grading after each submission. It verifies the complete graph result count, available learning activities, reload persistence, guided feedback, lesson completion, isolation of guided work from diagnostic evidence, and a fresh independent check saved against the lesson's exact skill. A failure to find a lesson needs investigation; uncertain evidence may legitimately call for another check before instruction.

Example for the pending revision-six rollout, **after publication, default-selection verification and the compound-production smoke check**:

```sh
node --import tsx scripts/verify-live-granular-journey.mts \
  --base-url https://app.trouvetaplume.com \
  --release-key french-granular-diagnostic-v7 \
  --expected-scope 158 \
  --credentials-file tmp/plume-granular-r6-default-qa.json \
  --output-prefix tmp/plume-r6-live
```

Progress, final results and learning verification are separate JSON files. A final-results file alone does not prove the lesson or independent check passed. The runner does not publish, promote, reset a diagnostic, certify mastery or replace pedagogical review. Stop or inspect an existing running process before starting another against the same account.
