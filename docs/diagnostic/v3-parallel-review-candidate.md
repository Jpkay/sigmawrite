# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6681 selected draft/repaired question versions, 238 canonically reviewed questions, 6896 mapped questions.

345 of 542 targets have allocated initial and follow-up pools; 197 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

338 lessons and 1882 guided exercises are pinned as published_pending_review. 324 lesson targets have allocated initial/follow-up pools; 324 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 15 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:793cdcd185c6a4c278447533d45f4bd1fac60eb6355ef4afd278321eac60fdc3.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 30; append --check to verify without writing.
