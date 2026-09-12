# Complex negation: draft preparation

Status: integrated in the next local 261-target candidate (bank revision 17), not published. No human review is recorded.

Approved parent node: `construction_negation_complexe`, reading-analysis evidence. The authored questions distinguish ne…plus, ne…jamais, ne…rien, ne…personne and ne…guère. Each has eight independent sentences; three ne…pas and three restrictive ne…que counterexamples give 46 questions total. Four choices are used per question. The requested meaning is limited to the situation and time stated in the sentence; guère does not imply a quantity of zero.

A recognition lesson supplies five explanation steps and seven guided questions covering all five meanings and both counterexample types. Guided sentences are distinct from the independent bank. Its boundary explicitly excludes production, ni…ni and arbitrary combinations of negation. Three focused tests, deterministic generation and TypeScript pass.

Coverage now requires four different questions and contexts per meaning, consistent with the existing 1% guessing ceiling for four choices. Both pools must satisfy this contract. A correct response to ne…plus must not stand in for evidence about jamais, rien, personne or guère. Preserve all approved parent criteria and report unresolved features; do not claim the untested meanings are mastered. The versioned `complexNegationFeature` metadata now enforces this contract; older banks without these questions keep their original requirements. The complete lesson journey passes with seven guided exercises (including a deliberate error), then 21 fresh independent checks. Assertions verify four checks and contexts for each meaning plus a counterexample, preserved guided/evidence separation and reload. Production remains a separate unresolved target.

The frozen 260-target v17 candidate remains unchanged by these drafts. Owner content review continues in parallel with release work.

All 640 granular tests and TypeScript pass. A regression shows an overall score above 80% cannot hide incorrect answers on rien. Another confirms complete five-meaning evidence can pass, while plus-only evidence cannot. All eight profile simulations and the read-only upgrade audit pass against the final candidate. The bank and deployment have not been published.

The service test initially selected an untracked legacy question. Only when the new meaning format is present, the adapter now excludes older questions from this recognition target. The canonical bank and historical release behavior remain unchanged; a regression verifies both paths.
