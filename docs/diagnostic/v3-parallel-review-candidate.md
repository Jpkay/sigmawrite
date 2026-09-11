# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3933 selected draft/repaired question versions, 238 canonically reviewed questions, 4156 mapped questions.

253 of 542 targets have allocated initial and follow-up pools; 289 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

106 lessons and 586 guided exercises are pinned as published_pending_review. 102 lesson targets have allocated initial/follow-up pools; 100 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 100-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:1179da5aa04878be2039171f209c37ea080b46f921895a9bc58ad8e9b5adb634.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
