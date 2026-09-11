import {EXPLICIT_READING_TEACHING} from "./explicit-reading-teaching";
import {AGREEMENT_CONSTRUCTION_TEACHING} from "./agreement-construction-teaching";
import {COI_PRONOUN_TEACHING} from "./coi-pronoun-teaching";
import {COD_PRONOUN_TEACHING} from "./cod-pronoun-teaching";
import {ON_OM_TEACHING} from "./on-om-teaching";
import {CANONICAL_SENTENCE_TEACHING} from "./canonical-sentence-teaching";
import {CONJUGATION_FOUNDATION_TEACHING} from "./conjugation-foundation-teaching";
import {DETERMINER_AGREEMENT_TEACHING} from "./determiner-agreement-teaching";
import {PERSON_NUMBER_TEACHING} from "./person-number-teaching";
import {Y_EN_TEACHING} from "./y-en-teaching";
import {DIRECT_OBJECT_TEACHING} from "./direct-object-teaching";
import {PERIPHRASTIC_RECOGNITION_TEACHING} from "./periphrastic-recognition-teaching";
import {SUBJECT_TEACHING} from "./subject-teaching";
import {AGREEMENT_TEACHING} from "./agreement-teaching";
import {SPELLING_TEACHING} from "./spelling-teaching";
import {CONJUGATION_TEACHING} from "./conjugation-teaching";
import {READING_TEACHING} from "./reading-teaching";
import {PRONOUN_PLACEMENT_TEACHING} from "./pronoun-teaching";
import type {TargetTeachingContent} from "./teaching-content";

/** Authoring inventory only. Importing a draft never grants approval or a binding. */
export const FRENCH_TEACHING_DRAFTS:readonly TargetTeachingContent[]=[...EXPLICIT_READING_TEACHING,...AGREEMENT_CONSTRUCTION_TEACHING,...COI_PRONOUN_TEACHING,...COD_PRONOUN_TEACHING,...ON_OM_TEACHING,...CANONICAL_SENTENCE_TEACHING,...CONJUGATION_FOUNDATION_TEACHING,...DETERMINER_AGREEMENT_TEACHING,...PERSON_NUMBER_TEACHING,...Y_EN_TEACHING,...DIRECT_OBJECT_TEACHING,...PERIPHRASTIC_RECOGNITION_TEACHING,...SUBJECT_TEACHING,...AGREEMENT_TEACHING,...PRONOUN_PLACEMENT_TEACHING,...READING_TEACHING,...SPELLING_TEACHING,...CONJUGATION_TEACHING];
