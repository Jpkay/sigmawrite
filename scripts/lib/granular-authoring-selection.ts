import {QUESTION_DETAIL_READING_TEACHING} from '../../src/lib/diagnostic/granular/question-detail-reading-teaching';
import {ETRE_PARTICIPLE_AGREEMENT_TEACHING} from '../../src/lib/diagnostic/granular/etre-participle-agreement-teaching';
import {FRENCH_DRAFT_EXPANSION_SOURCES} from '../../src/lib/diagnostic/granular/draft-expansion-sources';
import {FRENCH_TEACHING_DRAFTS} from '../../src/lib/diagnostic/granular/draft-teaching-catalogue';
import {VERB_FAMILY_RECOGNITION_TEACHING} from '../../src/lib/diagnostic/granular/verb-family-recognition-teaching';
import {granularBankOptions} from './granular-bank-options';
/** One explicit choice selects questions, teaching and facet compilation together.
 * Default assembly continues to reproduce the existing release. */
export function selectedDraftExpansionSources(args:readonly string[]):readonly string[]{
 const options=granularBankOptions(args);
 if(!options.verbFamilyRecognition&&!options.etreParticipleAgreement)return FRENCH_DRAFT_EXPANSION_SOURCES;
 return [...FRENCH_DRAFT_EXPANSION_SOURCES,...(options.verbFamilyRecognition?['verb-family-recognition-faceted']:[]),...(options.etreParticipleAgreement?['etre-participle-agreement']:[]),...(options.questionDetailReading?['question-detail-reading']:[])];
}
export function selectedTeachingDrafts(args:readonly string[]){
 const options=granularBankOptions(args);
 if(!options.verbFamilyRecognition&&!options.etreParticipleAgreement)return FRENCH_TEACHING_DRAFTS;
 return [...FRENCH_TEACHING_DRAFTS,...(options.verbFamilyRecognition?VERB_FAMILY_RECOGNITION_TEACHING:[]),...(options.etreParticipleAgreement?ETRE_PARTICIPLE_AGREEMENT_TEACHING:[]),...(options.questionDetailReading?QUESTION_DETAIL_READING_TEACHING:[])];
}
