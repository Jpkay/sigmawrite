# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

7383 selected draft/repaired question versions, 238 canonically reviewed questions, 7597 mapped questions.

373 of 544 targets have allocated initial and follow-up pools; 171 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

386 lessons and 2168 guided exercises are pinned as published_pending_review. 372 lesson targets have allocated initial/follow-up pools; 372 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 5 prerequisite targets in their 378-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:0bfead176f26aa4b3cf930098ead6b5d3ede87d3997532a99941934b78fac030.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 45 --verb-family-recognition --etre-participle-agreement --question-detail-reading --local-definition-reading --avoir-participle-agreement --causal-reading-genres --cause-relation-family --passe-recent-modal-family; append --check to verify without writing.
