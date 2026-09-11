# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3365 selected draft/repaired question versions, 238 canonically reviewed questions, 3588 mapped questions.

247 of 542 targets have allocated initial and follow-up pools; 295 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

60 lessons and 307 guided exercises are pinned as published_pending_review. 56 lesson targets have allocated initial/follow-up pools; 52 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 52-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:016e55fc86ff81a44b4f98a430044ec455f77232aa0ffc57ff67b50d67203c83.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
