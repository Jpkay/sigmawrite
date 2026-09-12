import {FRENCH_DRAFT_EXPANSION_SOURCES} from '../../src/lib/diagnostic/granular/draft-expansion-sources';
import {FRENCH_TEACHING_DRAFTS} from '../../src/lib/diagnostic/granular/draft-teaching-catalogue';
import {VERB_FAMILY_RECOGNITION_TEACHING} from '../../src/lib/diagnostic/granular/verb-family-recognition-teaching';
import {granularBankOptions} from './granular-bank-options';
/** One explicit choice selects questions, teaching and facet compilation together.
 * Default assembly continues to reproduce the existing release. */
export function selectedDraftExpansionSources(args:readonly string[]):readonly string[]{
 return granularBankOptions(args).verbFamilyRecognition?[...FRENCH_DRAFT_EXPANSION_SOURCES,'verb-family-recognition-faceted']:FRENCH_DRAFT_EXPANSION_SOURCES;
}
export function selectedTeachingDrafts(args:readonly string[]){
 return granularBankOptions(args).verbFamilyRecognition?[...FRENCH_TEACHING_DRAFTS,...VERB_FAMILY_RECOGNITION_TEACHING]:FRENCH_TEACHING_DRAFTS;
}
