# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6263 selected draft/repaired question versions, 238 canonically reviewed questions, 6478 mapped questions.

321 of 542 targets have allocated initial and follow-up pools; 221 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

318 lessons and 1747 guided exercises are pinned as published_pending_review. 300 lesson targets have allocated initial/follow-up pools; 300 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 39 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:05d92cb48ef56e3beb3e0ea785ea449a3770accbbe96550bff8c695cb9ce3328.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
