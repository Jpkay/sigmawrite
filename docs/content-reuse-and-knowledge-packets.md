# Content reuse and knowledge packets

## What is live

Student reading recommendations still start with the established approved-content ranker. The contract-aware matcher now runs immediately afterward:

- `off`: return the established ranking and collect nothing;
- `shadow`: preserve the established ranking and record the matcher's counterfactual choice;
- `trial`: expose the matcher only to a deterministic 10% student cohort;
- `live`: expose the matcher to all students, while retaining the established ranker as the no-match fallback.

The initial database policy is `shadow`. A code deployment therefore cannot silently change what students see.

Each observed decision stores the policy and request snapshots, candidate ranking, exclusions, baseline order, displayed order, latency, and selected version. A reading session is linked to the most recent eligible observation. Calibration uses completed, non-abandoned sessions and their reading success rate.

## Promotion and rollback

The default gates are 100 completed matcher selections, a 70% completion rate, and 75% average reading success. Threshold evaluation starts at the active threshold and may only recommend the same or a stricter threshold; it never extrapolates into an unobserved lower-score range.

Promotion is deliberately two-step:

1. Shadow evidence may start the bounded trial.
2. Outcomes from requests that were actually exposed to the matcher may promote the trial to live.

`advanceContentReuseRollout` recomputes the evidence server-side and the database creates an immutable next policy version only when the expected evidence decision is present. `returnContentReuseToShadow` is the immediate manual rollback. Every transition retains its evidence and actor in `content_reuse_policy_events` and the general audit log.

The main operating metrics are match rate, exclusion reasons, matcher-selection rate, completion rate, abandonment rate, reading success, threshold distribution, and latency. “Web-search avoidance” is intentionally not a metric because this product does not currently search the web during generation.

## Knowledge-packet lifecycle

`knowledge_concept_packets` holds a versioned body for each concept: a French explanation, atomic claims, misconceptions, examples, vocabulary, provenance, risk class, source policy, and review date. Sources live in `knowledge_packet_sources`.

A packet is prompt-eligible only when it is human-approved and unexpired. The database rejects approval when:

- its parent concept is not human-approved;
- its risk or source policy diverges from the concept;
- required sources are absent;
- a high-risk packet lacks a recently accessed primary source;
- its review date has expired or is more than 90 days away for current-primary-source content.

Approved packets and their source snapshots are immutable; editors retire one and approve a new version. Existing approved, source-free concept descriptions are migrated as starter packets. Concepts that require sources remain drafts. New concepts automatically receive a draft, so coverage can grow from real gaps rather than an upfront knowledge-base project.

## Generation boundary

The admin generation action accepts only the public request schema. It retrieves approved packets on the server from the requested interest and concept terms, validates their shape and freshness, and then adds them to the generation input. Clients cannot submit their own grounding packets.

The prompt marks packet content as reference data, never instructions. Generated factual claims may cite packet IDs. When a candidate is published, grounded concepts are linked to the text version at confidence `1.0`; remaining interest-derived mappings are marked as lower-confidence backfill. Those links feed the reusable-passage profile.

If no approved packet exists, generation continues without one. Draft packet creation and approval are separate human-governed actions, so an automatically created draft cannot ground future passages until an editor approves it.

## Deployment order

1. Apply migrations `0108_calibrated_reuse_and_knowledge_packets.sql` through `0111_freeze_approved_knowledge_packet_sources.sql`.
2. Deploy the application code.
3. Confirm that the active reuse policy is still `shadow` and observations are accumulating.
4. Review the calibration report; advance one stage only when its evidence decision permits it.
5. Return to shadow immediately if trial or live outcomes regress.
