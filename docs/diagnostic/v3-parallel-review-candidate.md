# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6053 selected draft/repaired question versions, 238 canonically reviewed questions, 6268 mapped questions.

301 of 542 targets have allocated initial and follow-up pools; 241 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

288 lessons and 1639 guided exercises are pinned as published_pending_review. 270 lesson targets have allocated initial/follow-up pools; 270 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 270-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:2c6d6001a9f4dba9ed7a92d580d5d05a8508d921e2d6b5f65e4720bd9ed2020c.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
