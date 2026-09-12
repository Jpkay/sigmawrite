# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5767 selected draft/repaired question versions, 238 canonically reviewed questions, 5988 mapped questions.

295 of 542 targets have allocated initial and follow-up pools; 247 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

270 lessons and 1526 guided exercises are pinned as published_pending_review. 252 lesson targets have allocated initial/follow-up pools; 252 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 1 prerequisite targets in their 253-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:b51dc6cb5fb0f5cd9166211f6272e48087d44f5805df5dc435d5e9a08ae5277b.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
