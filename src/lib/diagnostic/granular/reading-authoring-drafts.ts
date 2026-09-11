import {NARRATIVE_CAUSE_DRAFTS} from "./reading-drafts";
import {READING_COVERAGE_DRAFTS} from "./reading-coverage-drafts";
import {READING_REFERENCE_DRAFTS} from "./reading-reference-drafts";
import {READING_TIME_DRAFTS} from "./reading-time-drafts";
import {READING_VOCABULARY_DRAFTS} from "./reading-vocabulary-drafts";
/** Shared authoring inventory; inclusion conveys no review approval. */
export const READING_AUTHORING_DRAFTS=[
 ...NARRATIVE_CAUSE_DRAFTS.map(draft=>({...draft,nodeKey:"inferer_cause_locale",genre:"narrative"})),
 ...READING_COVERAGE_DRAFTS,...READING_REFERENCE_DRAFTS,...READING_TIME_DRAFTS,...READING_VOCABULARY_DRAFTS,
];
