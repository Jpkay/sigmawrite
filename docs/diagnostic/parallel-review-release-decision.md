# Parallel French content review and student release

Decision recorded 2026-09-11 from the product owner's instruction:

> We need to release and do the review in parallel while students already start to use the product, and I will review.

The product owner will review. First student use need not wait for completion of
human content review. This supersedes the earlier requirement to wait for all
content approvals before activating the first granular release. The approved
French graph remains the foundation, and the full granular diagnostic/pathway
objective remains open.

Implementation separates permission to serve selected content from human review.
`parallel_review` identifies the release policy; each selected question is pinned
to its exact bank and content checksum. Question review states and historical
reviewer provenance are preserved. Structural and answer-key gates still run.
No human approval, calibrated mastery claim or completed review is fabricated.

Students should see that the assessment and pathway are provisional. Skills
without enough evidence remain unresolved. Supported questions, lessons and
fresh checks must form a usable journey; unsupported destinations must not be
presented as working learning activities. The first rollout can precede complete
curriculum coverage, while the remaining coverage work continues.

Current implementation: selected-question policy, adapter, bank validator and
check-registry support exist. The candidate contains 3,488 mapped questions and
239 targets with separate initial/follow-up pools. There are 303 targets without
complete pools. Teaching permission now includes 37 lessons and 183 guided exercises. Twenty-nine
lesson targets retain fresh follow-up capacity, but their prerequisite closure
includes 8 targets with incomplete pools. Supported-scope assembly, student-facing
status, deployment migrations and the live journey still need completion. No
production activation has occurred as part of this decision record.

Reviewer material:
- `v3-question-repair-review.md`: before/after corrections.
- `v3-teaching-review-catalogue.json`: complete draft teaching content.
- `v3-parallel-review-candidate.json`: scope, selected versions and pool gaps.
