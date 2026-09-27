# Awaiting import writes on failure

The diagnostic importer runs a bounded set of independent item writes. Previously, Promise.all rejected immediately when one worker failed while other workers continued scheduling writes. The importer could therefore report a failure before the database stopped changing.

The shared worker helper now stops scheduling after the first observed failure, awaits every already-started worker, and then rethrows the original failure. Successful imports still process each entry once. Invalid concurrency fails before any work. This does not make the import transactional: partially imported draft banks still require inspection and an explicit rerun. The existing exact relational verification remains required before publication.

Eight focused tests cover the concurrency bound, exactly-once scheduling, deferred in-flight completion, no scheduling after failure, invalid limits and preservation of an undefined rejection. Type checking passes. Source utility lint passes; the repository ESLint configuration excludes operator scripts.

The revision-two import already running from frozen source 29c4ac7 is unaffected by this change. It must be observed to termination rather than restarted to pick up this helper.
