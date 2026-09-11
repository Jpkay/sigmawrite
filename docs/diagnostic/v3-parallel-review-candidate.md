# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4639 selected draft/repaired question versions, 238 canonically reviewed questions, 4862 mapped questions.

267 of 542 targets have allocated initial and follow-up pools; 275 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

176 lessons and 960 guided exercises are pinned as published_pending_review. 158 lesson targets have allocated initial/follow-up pools; 156 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 156-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:f552c9625418119440f6ec4d179dd8e4d84dba0d410cdea396a5900b8848538a.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
