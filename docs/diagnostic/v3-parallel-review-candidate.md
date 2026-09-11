# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4655 selected draft/repaired question versions, 238 canonically reviewed questions, 4878 mapped questions.

269 of 542 targets have allocated initial and follow-up pools; 273 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

178 lessons and 972 guided exercises are pinned as published_pending_review. 160 lesson targets have allocated initial/follow-up pools; 158 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 158-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:fb7feb62c3f14f5941052ca36e431ac37ae4b5e94d366f48768bb53667d43c1a.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
