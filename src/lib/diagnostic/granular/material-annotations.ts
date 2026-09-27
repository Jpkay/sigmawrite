import {readAudioStimulus,parseAudioStimulus} from "./audio-stimulus";
import {z} from "zod";
import {materialIdentity} from "./material-identity";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {TargetTeachingContent} from "./teaching-content";
const schema=z.object({
 elidedGapAliases:z.boolean().optional(),
 words:z.array(z.object({lemma:z.string().trim().min(1),form:z.string().trim().min(1)}).strict()).max(1000).default([]),
 sentences:z.array(z.string().trim().min(1)).max(1000).default([]),
 assessed:z.object({words:z.array(z.string().trim().min(1)).max(1000).default([]),sentences:z.array(z.string().trim().min(1)).max(1000).default([])}).strict().optional(),
}).strict();
export type MaterialExposureAnnotation=z.input<typeof schema>;
/** Keep the original key for saved exposure histories and add a conservative
 * alias only for an elided first-person subject immediately before a gap.
 * Complete sentences and words retain their original identities. */
function sentenceKeys(sentence:string):string[]{
 const unelided=sentence.replace(/\b([Jj])[’'‘]\s*___/g,"$1e ___");
 return [...new Set([materialIdentity("sentence",sentence),materialIdentity("sentence",unelided)])];
}

/** Structural anchoring complements content review; it cannot prove that a
 * supplied lemma is correct or that all relevant material has been annotated. */
export function annotatedMaterialKeys(raw:unknown,sourceTexts:readonly string[]):string[]{
 if(raw===undefined)return [];
 const annotation=schema.parse(raw);
 const sources=sourceTexts.map(text=>text.normalize("NFC"));
 const anchored=(text:string)=>sources.some(source=>source.includes(text.normalize("NFC")));
 if(annotation.words.some(word=>!anchored(word.form))||annotation.sentences.some(sentence=>!anchored(sentence)))throw Error("Material annotation is not anchored in source content");
 const keys=[...new Set([
  ...annotation.words.map(word=>materialIdentity("word",word.lemma)),
  ...annotation.sentences.flatMap(sentence=>annotation.elidedGapAliases?sentenceKeys(sentence):[materialIdentity("sentence",sentence)]),
 ])].sort();
 if(!keys.length||keys.length>1000)throw Error("Invalid material annotation size");
 if(annotation.assessed&&assessedKeys(annotation).some(key=>!keys.includes(key)))throw Error("Assessed material must be included in exposure annotations");
 return keys;
}
function assessedKeys(annotation:z.output<typeof schema>):string[]{
 return [...new Set(annotation.assessed?[
  ...annotation.assessed.words.map(word=>materialIdentity("word",word)),
  ...annotation.assessed.sentences.flatMap(sentence=>annotation.elidedGapAliases?sentenceKeys(sentence):[materialIdentity("sentence",sentence)]),
 ]:[...annotation.words.map(word=>materialIdentity("word",word.lemma)),...annotation.sentences.flatMap(sentence=>annotation.elidedGapAliases?sentenceKeys(sentence):[materialIdentity("sentence",sentence)])])].sort();
}
/** Omitting assessed preserves conservative older annotations: all exposed
 * material counts as target material. An explicit subset can exclude context. */
export function questionAssessedMaterialKeys(item:CanonicalDiagnosticBankItem["item"]){
 questionMaterialKeys(item);
 return [...new Set([...(item.validatorConfig?.materialExposure===undefined?[]:assessedKeys(schema.parse(item.validatorConfig.materialExposure))),...questionAudioMaterialKeys(item)])].sort();
}
function questionAudioMaterialKeys(item:CanonicalDiagnosticBankItem["item"]){
 const audio=readAudioStimulus(item);
 return audio?[`audio:${audio.sha256}`]:[];
}
export function questionMaterialKeys(item:CanonicalDiagnosticBankItem["item"]){
 const sentence=item.validatorConfig?.sentenceApplication;
 const completed=typeof sentence==="string"&&item.validatorType==="conjugator"&&item.responseType==="short_answer"&&item.correctAnswer&&item.promptFr.includes(sentence)&&sentence.split("___").length===2
  ?[item.correctAnswer,...(item.acceptableAnswers??[])].map(answer=>sentence.replace("___",answer)):[];
 return [...new Set([...questionAudioMaterialKeys(item),...annotatedMaterialKeys(item.validatorConfig?.materialExposure,[item.promptFr,item.instructionsFr??"",item.correctAnswer??"",...completed,...(item.acceptableAnswers??[]),...(item.choices??[]).map(choice=>choice.text)])])].sort();
}
export function teachingMaterialKeys(lesson:TargetTeachingContent|Omit<TargetTeachingContent,"status">){
 const audioKeys=[...lesson.steps,...lesson.practice].flatMap(part=>{const audio=parseAudioStimulus(part.audioStimulus);return audio?[`audio:${audio.sha256}`]:[];});
 return [...new Set([...audioKeys,...annotatedMaterialKeys(lesson.materialExposure,[lesson.titleFr,lesson.learnerQuestionFr,lesson.takeawayFr,lesson.boundaryFr,
  ...lesson.steps.flatMap(step=>[step.exampleFr,step.explanationFr]),
  ...lesson.practice.flatMap(exercise=>[exercise.promptFr,exercise.answerFr,exercise.hintFr,exercise.explanationFr,...(exercise.choices??[])]),
 ])])].sort();
}
