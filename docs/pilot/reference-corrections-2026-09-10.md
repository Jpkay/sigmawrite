# Corrected reference sample — 10 September 2026

> Historical pre-calibration snapshot. For current policy, see [the integration checkpoint](../diagnostic/workstreams/review-cleanup.md). Original evidence below remains unchanged.

All three corrected passages are saved as version 2 in the live review portal. Each passed the unchanged `selective-passage-2` automated QA policy. Deliberately replacing a correct answer with a distractor was held by question QA; duplicating a choice was also held. This is a successful technical preflight, **not completed human calibration**. No human approval was created. Automatic publication remains disabled.

## Changes

- Puddle: expanded and simplified within the original requested reading-band/length tolerance; the humidity answer is now explicitly supported. Rephrased two correct verbs that the grammar checker misclassified as adjectives. Final measured length: 273 words; difficulty 45.
- Shadows: corrected punctuation and the misleading suggestion that the Sun is nearly overhead everywhere at noon; rebuilt the questions around the revised explanation. Final measured length: 236 words; difficulty 52.
- Roots: removed invented source packet IDs and unsupported specificity; rebuilt the passage and questions around elementary anchorage, absorption and storage functions. Actual research URLs are stored as editorial references, not invented internal packet identifiers. Final measured length: 228 words; difficulty 43.

The revised texts were generated with `openai/gpt-5.4` and independently checked by `openai/gpt-5.4-mini`, real moderation, private LanguageTool, deterministic scoring/answer checks and semantic duplicate search. The puddle's additional editorial rephrasings are recorded explicitly. No QA threshold or requested reading level was lowered.

The transaction was first exercised with rollback, then committed to `pwztnrirtrnicywvdbpz`. It required unchanged original snapshots, no draft or submitted human work and disabled automatic publication. The three original immutable versions were retired; their QA reports remain unchanged. All nine unopened assignments were moved to version 2 with stable IDs, so there is no duplicate assignment or lost human review. Other passages were untouched.

## Independent review links

Each passage needs two genuine independent reviews for reference calibration. JP and Astrid can provide them; the third assigned reviewer can continue independently. Reviewers should not exchange verdicts before submitting.

| Passage | JP | Astrid |
| --- | --- | --- |
| Puddle | [Review](https://app.trouvetaplume.com/review/a3b40e3d-c8f4-40da-b9b3-bbc1eddc220e) | [Review](https://app.trouvetaplume.com/review/cd723847-c9f8-47d5-b54b-ab935dd452ed) |
| Shadows | [Review](https://app.trouvetaplume.com/review/25d2e18d-ce56-4451-a3fb-ee8b6a7a5d71) | [Review](https://app.trouvetaplume.com/review/275a5638-d043-4498-be9d-36289bd64969) |
| Roots | [Review](https://app.trouvetaplume.com/review/4a070a6e-6f0b-4ca4-8717-812b4a209426) | [Review](https://app.trouvetaplume.com/review/822aaad3-f20f-41e1-b006-badb1a053178) |

After the real reviews arrive, rerun `scripts/calibrate-passage-automation.mts --record` with the production-equivalent private environment. The formal comparison combines in-scope independently reviewed references with existing reviewed cases and negative controls. Any new concerns must be resolved before enabling the bounded pilot. There is no requirement to finish all 60 historical passages.

## Editorial fact references

- [USGS: evaporation and the water cycle](https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle).
- [USGS: effects of temperature, wind and humidity](https://pubs.usgs.gov/wsp/1255/report.pdf).
- [NASA: Sun, seasons and shadow angles](https://assets.science.nasa.gov/content/dam/science/esd/eo/eokids/wp-content/uploads/sites/6/2019/04/16_SunSeasons-508.pdf).
- [University of Minnesota: roots](https://open.lib.umn.edu/horticulture/chapter/3-3-roots/).
- [University of Minnesota: plants and water](https://open.lib.umn.edu/horticulture/chapter/11-1-plants-and-water/).

Full proposed payloads, source references, independent QA reports, negative controls, final version IDs and readback verification are preserved in [the evidence file](./reference-corrections-2026-09-10.json). Its `formalCalibrationPassed=false` records the outstanding human step, not a failed automated preflight.
