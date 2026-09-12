# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6713 selected draft/repaired question versions, 238 canonically reviewed questions, 6928 mapped questions.

347 of 542 targets have allocated initial and follow-up pools; 195 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

340 lessons and 1894 guided exercises are pinned as published_pending_review. 326 lesson targets have allocated initial/follow-up pools; 326 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 13 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:8d90a4df7f8533de4fe1326a65da8cdd513e8da90a0ce0d85c8ddef06fb4dd44.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 31; append --check to verify without writing.
