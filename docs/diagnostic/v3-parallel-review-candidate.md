# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4671 selected draft/repaired question versions, 238 canonically reviewed questions, 4894 mapped questions.

271 of 542 targets have allocated initial and follow-up pools; 271 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

180 lessons and 982 guided exercises are pinned as published_pending_review. 162 lesson targets have allocated initial/follow-up pools; 160 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 160-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:4d021ea9b5b71300792dedbabbda07c3f0297b3d2b3bbcab18630114d1f93ac8.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
