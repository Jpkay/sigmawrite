# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6777 selected draft/repaired question versions, 238 canonically reviewed questions, 6992 mapped questions.

351 of 542 targets have allocated initial and follow-up pools; 191 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

344 lessons and 1910 guided exercises are pinned as published_pending_review. 330 lesson targets have allocated initial/follow-up pools; 330 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 9 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:d9ba0d98e026af9b08845af7b3cff4f20eecb547806e4060bb3f5cad75d7e4d2.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 32; append --check to verify without writing.
