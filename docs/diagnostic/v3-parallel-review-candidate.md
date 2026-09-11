# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4121 selected draft/repaired question versions, 238 canonically reviewed questions, 4344 mapped questions.

255 of 542 targets have allocated initial and follow-up pools; 287 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

122 lessons and 682 guided exercises are pinned as published_pending_review. 118 lesson targets have allocated initial/follow-up pools; 116 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 116-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:42f1c4afabc5c39c5c9480ea6897fb8e8c7346a37f00bbb27f25a31fcbe4a01b.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
