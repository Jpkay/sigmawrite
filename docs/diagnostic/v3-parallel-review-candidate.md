# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4431 selected draft/repaired question versions, 238 canonically reviewed questions, 4654 mapped questions.

265 of 542 targets have allocated initial and follow-up pools; 277 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

146 lessons and 812 guided exercises are pinned as published_pending_review. 142 lesson targets have allocated initial/follow-up pools; 140 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 140-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:636f7f1693a81b787a53d981519f33e2cc49370e18a365d44b4c3f2081a8c982.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
