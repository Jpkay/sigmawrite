# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4623 selected draft/repaired question versions, 238 canonically reviewed questions, 4846 mapped questions.

266 of 542 targets have allocated initial and follow-up pools; 276 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

161 lessons and 900 guided exercises are pinned as published_pending_review. 157 lesson targets have allocated initial/follow-up pools; 155 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 155-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:223a3dec59cfec79c683b39a27227785cda2f8675039792dc683a48fdba9a047.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
