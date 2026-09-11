# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4727 selected draft/repaired question versions, 238 canonically reviewed questions, 4950 mapped questions.

276 of 542 targets have allocated initial and follow-up pools; 266 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

185 lessons and 1006 guided exercises are pinned as published_pending_review. 167 lesson targets have allocated initial/follow-up pools; 165 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 165-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:b84fafb7bdab304fbdc5527caec8ded24cd0d1d538d291f8ef2b828b8076d858.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
