# Subject–verb agreement lesson-to-check review

Draft feasibility only. No approval, publication or activation.

| Lesson | Eligible | Drafts | Distinct target verbs | Exposed by lesson | Guess floor | Minimum correct per pool | Initial / later | Allocation |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| Accorder le verbe avec le sujet placé juste avant | 0 | 14 | 14 | 0 | 0.5 | 7 | 7 / 7 | allocated |
| Retrouver le sujet malgré les mots entre les deux | 0 | 14 | 14 | 0 | 0.5 | 7 | 7 / 7 | allocated |
| Accorder quand le sujet vient après le verbe | 0 | 14 | 14 | 0 | 0.5 | 7 | 7 / 7 | allocated |
| Accorder avec deux sujets reliés par et | 0 | 14 | 14 | 0 | 0.5 | 7 | 7 / 7 | allocated |

The approved evidence rule requires fresh target words. The allocation uses annotated verb lemmas, not question IDs, and conservatively excludes candidates whose assessed material already occurs in the corresponding lesson. This check does not establish complete exposure history or rule out semantic overlap. Context vocabulary annotations require review as well.

The draft uses a conservative two-way guessing floor for the number decision, conditional on knowing the singular/plural forms. This is an explicit model assumption awaiting calibration, not a measured guessing rate. The chance threshold requires seven all-correct answers per pool under that assumption; the approved accuracy, novelty and occasion requirements remain additional conditions.

Subject selection and verb conjugation can both cause a wrong response. Review the difficulty and prerequisite fit of each question; these supplied-tense exercises alone cannot establish independent writing or identify the cause of every error. Multiple occasions are still required for mastery.

The JSON pins target mappings, prerequisites, evidence rules, lesson/question checksums and material identities. No graph rule is weakened. Reproduce with npx tsx scripts/build-agreement-pathway-review.mts; append --check to verify.
