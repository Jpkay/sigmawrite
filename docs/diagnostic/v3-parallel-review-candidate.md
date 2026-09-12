# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6613 selected draft/repaired question versions, 238 canonically reviewed questions, 6828 mapped questions.

341 of 542 targets have allocated initial and follow-up pools; 201 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

334 lessons and 1858 guided exercises are pinned as published_pending_review. 320 lesson targets have allocated initial/follow-up pools; 320 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 19 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:cfdaaa78b02ef53a27380f806e6a7c801b551c025b618064e373416f7989fe39.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 28; append --check to verify without writing.
