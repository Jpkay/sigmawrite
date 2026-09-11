# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3885 selected draft/repaired question versions, 238 canonically reviewed questions, 4108 mapped questions.

250 of 542 targets have allocated initial and follow-up pools; 292 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

103 lessons and 565 guided exercises are pinned as published_pending_review. 99 lesson targets have allocated initial/follow-up pools; 97 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 97-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:a8309dc0684e97aa51f873d1ec9b55c1997dcdccd1a44a50a713a6660195e768.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
