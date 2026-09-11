# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5431 selected draft/repaired question versions, 238 canonically reviewed questions, 5654 mapped questions.

288 of 542 targets have allocated initial and follow-up pools; 254 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

249 lessons and 1404 guided exercises are pinned as published_pending_review. 231 lesson targets have allocated initial/follow-up pools; 231 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 231-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:30ca9452ef0a92a8718b623a9c4e7c6a35154ce3b6999bbf8d84c88779865c2b.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
