# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6005 selected draft/repaired question versions, 238 canonically reviewed questions, 6220 mapped questions.

301 of 542 targets have allocated initial and follow-up pools; 241 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

284 lessons and 1615 guided exercises are pinned as published_pending_review. 266 lesson targets have allocated initial/follow-up pools; 266 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 266-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:7126103ecf64a07126bce6a3895f745771ac78000cad43693df22de94e0b749d.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
