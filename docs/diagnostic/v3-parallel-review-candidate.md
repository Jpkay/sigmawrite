# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6209 selected draft/repaired question versions, 238 canonically reviewed questions, 6424 mapped questions.

303 of 542 targets have allocated initial and follow-up pools; 239 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

300 lessons and 1711 guided exercises are pinned as published_pending_review. 282 lesson targets have allocated initial/follow-up pools; 282 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 282-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:75c519727160fdd23c18a3d34d798e022ff5d11f0a0026709a007533e109d18f.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
