# Relative-clause recognition and production profiles

Two prescribed synthetic profiles test opposite recognition/production outcomes using the actual prepared question pools. Both retain separate probabilities and route the weaker mode to its exact lesson. The fixture explicitly assumes previously established canonical-sentence foundations; removing those foundations blocks the dependent lesson. One initial occasion does not become confirmed mastery.

This audit exposed an aggregation edge case: an explicitly assisted observation could influence a recognition target whose approved criteria did not require an unaided marker. Guided teaching currently stores practice separately, so this is a scoring-layer safeguard rather than evidence that live guided exercises were changing mastery. The engine now excludes observations marked unaided:false for every mode, while retaining existing handling of absent markers and strict unaided:true requirements where the graph requires them.

The regression checks cover assisted successes not erasing a gap, assisted errors not lowering independent results, and fresh independent checks on later occasions resolving the weaker mode without changing the other mode. Untouched clause-production targets remain untested.

Validation: 429 granular tests pass, together with TypeScript and source lint. The final targeted profiles pass after adding the assisted-error assertion. Six symbolic timed profiles and mixed/all-wrong command journeys pass. The tests prescribe evidence and synthetic foundations; they do not prove that every mode is sampled in one sitting or replace student calibration.
