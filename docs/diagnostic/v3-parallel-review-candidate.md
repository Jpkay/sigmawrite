# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4711 selected draft/repaired question versions, 238 canonically reviewed questions, 4934 mapped questions.

275 of 542 targets have allocated initial and follow-up pools; 267 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

184 lessons and 1000 guided exercises are pinned as published_pending_review. 166 lesson targets have allocated initial/follow-up pools; 164 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 164-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:c804616cc61a9b8283633988803122848bf7f816939131efe8a5dce970fa45ac.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
