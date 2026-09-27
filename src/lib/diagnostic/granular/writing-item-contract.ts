import {readWritingRubric} from './writing-rubric';
import type {GeneratedItem} from '@/lib/ai/item-generation/schemas';
/** Explicit authoring contract, not publication permission or grading approval. */
export function isSourceBoundWritingItem(item:GeneratedItem):boolean {
 if(item.validatorType!=='rubric'||item.modality!=='writing'||item.responseType!=='short_answer'
  ||item.correctAnswer!==undefined||item.acceptableAnswers.length||item.choices!==undefined
  ||item.validatorConfig?.writingEvaluation!=='source-bound-v1')return false;
 try{readWritingRubric(item.nodeKey,item.validatorConfig.writingRubric);return true;}catch{return false;}
}
