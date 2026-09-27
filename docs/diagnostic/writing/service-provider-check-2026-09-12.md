# Real-provider writing service check

Six synthetic submissions passed through the actual learning-check service and real writing evaluator using prepared bank items and their unchanged rubrics:

- Imparfait: correct, incorrect and a valid alternative without the target tense.
- Sentence-level grammar: correct plural subject–verb agreements, incorrect agreements, and a text without the targeted nominal plural subjects.

All six outcomes matched. The four assessed texts contained 12 targeted opportunities; all were found and individually graded as expected. The returned explanations identified the actual forms and the appropriate corrections. The two unresolved submissions were saved separately from scoring observations, closed their questions, and left skill results unchanged. None of these single submissions produced mastery.

The report preserves the synthetic text, pinned item checksum, evaluator protocol metadata and feedback. Reload uses the saved state. The harness never writes real student data or publishes a release.

Limits: real provider, in-memory persistence, synthetic students. This is not a deployed browser test, authenticated quota check or classroom calibration. Production remains unchanged.

Run with the configured provider credentials in the environment:

```sh
node --import tsx scripts/testing/granular-writing-service-live.mts
```

Optional `--case=grammar-unresolved` and `--report=path.json` select a case and output location. A failed case returns a nonzero exit status. The six-case report also received a post-run audit of the individual opportunity counts and verdicts.
