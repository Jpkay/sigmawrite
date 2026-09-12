# Fixed-pair sentence evidence proposal

Decision requested from the product owner: for son/sont and on/ont recognition only, replace the requirement for novel target words with a requirement for novel application sentences. The approved French parent nodes remain the same. This is a proposed correction to the approved evidence criteria, not a claim of reviewer approval.

The two words are necessarily familiar after instruction. The meaningful transfer question is whether the student can choose between them in a sentence that has not already been presented. The proposal retains all words in the delivery record, but identifies the sentence as the assessed material. This does not certify semantic novelty, attentive reading or a complete exposure history.

The before/after rules and source checksum are in `homophone-sentence-evidence-proposal.json`. All other rule fields remain unchanged, including minimum items, occasions, accuracy and contrasting errors. Each pair has eight initial and eight learning questions in the isolated allocation experiment. Old questions without the reviewed sentence annotation are excluded from the proposed pools.

The proposal function is called only by its authoring script and tests. It does not modify the approved graph file, the current candidate, published releases, student records or runtime loading. The source assessment is cloned. A changed source rule or missing material annotation stops preparation. New versions will need matching canonical question annotations and explicit release provenance before deployment; this experiment cannot be used as a runtime override.

Three targeted tests verify source immutability, unchanged other targets and thresholds, material preservation, pool sufficiency, rejection of seen sentences or incomplete histories, and failure on unexpected source contracts. Owner decision is pending. This request is necessary because the user explicitly selected the approved French graph, and this changes two of its evidence requirements.
