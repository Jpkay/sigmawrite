# Correcting the reading discrimination benchmark

The former literal-versus-inference profile marked any reading node containing `preuve`, `argument`, `inferer` or `point_de_vue` as weak. Consequently, three wrong answers on `localiser_span_preuve` could pass the inference contrast even though that node asks the student to locate a passage, not make an inference. The apparent pass overstated what had been tested.

The profile now explicitly identifies seven weak nodes: the five local inference targets, evaluating evidence relevance, and linking evidence to an interpretation. Explicit retrieval, locating a supporting passage, and identifying a stated thesis or reason remain known for this synthetic profile. The reference-gap profile likewise uses the four exact reference-resolution nodes rather than substring matching. Tests check that all named nodes exist in the approved French graph.

The corrected full-graph benchmark passes 10/10 depth checks and 5/8 discrimination checks with no runtime invariant violations. Three contrasts remain unresolved: verb-specific tense boundaries, literal versus inferential reading, and reference resolution. In the relevant otherwise-strong reading run, four questions target associating information with a question, four target locating supporting text, and one revisits information matching in another genre. This does not demonstrate inference or reference-resolution coverage.

These results are symbolic routing evidence, not content approval or psychometric validation. They do not justify claiming a complete diagnostic. The next reading-routing improvement must sample genuinely different reading operations within the time budget while retaining enough evidence to confirm a gap; simply changing a profile to make the existing route pass is not acceptable.

The frozen 197-target candidate and its running browser journey are unchanged by this benchmark correction.
