# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3941 selected draft/repaired question versions, 238 canonically reviewed questions, 4164 mapped questions.

254 of 542 targets have allocated initial and follow-up pools; 288 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

107 lessons and 592 guided exercises are pinned as published_pending_review. 103 lesson targets have allocated initial/follow-up pools; 101 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 101-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:0b20d7c9619fc6c23fa660e676e68475aea02de2e79f8965b1263c2668c05408.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
