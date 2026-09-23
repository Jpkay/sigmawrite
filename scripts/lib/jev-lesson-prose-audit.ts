import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";

import {JevClient,readNoul,type JevResponse} from "./jev-instruction-audit";

export const LESSON_PROSE_RUBRIC_VERSION="sigmawrite-french-lesson-prose-readability-v7";

export const LESSON_PROSE_QUESTIONS={
  prose_is_understandable:{
    type:"noul",
    instructions:"Can a French-speaking student around grade 5 understand the main meaning of this lesson text on a first careful reading? Judge the explanation wording, not the inherent difficulty of the grammar concept being taught.",
    criteria:{true:"The explanation is understandable in plain language.",false:"The wording or sentence structure is likely to prevent understanding."},
  },
  requires_unexplained_grammar_jargon:{
    type:"noul",
    instructions:"Does understanding this lesson text require knowing a grammar term that the text itself does not explain? Assume the student may not already know grammar jargon.",
    criteria:{true:"Unexplained grammar terminology blocks the explanation.",false:"Terms are absent, already explained in the text, or understandable from the wording."},
  },
  incidental_vocabulary_is_barrier:{
    type:"noul",
    instructions:"Does vocabulary incidental to the grammar concept make this lesson text hard for a grade-5 French reader to understand? Ignore the intended grammar concept itself.",
    criteria:{true:"Incidental vocabulary is likely to block comprehension.",false:"Incidental vocabulary is age-appropriate and clear."},
  },
} as const;

export interface LessonProseItem{
  id:string;
  lessonId:string;
  field:string;
  exactText:string;
  auditText:string;
  excludedTaskText:string|null;
  sourcePath:string;
  sourceStatus:string;
}

export interface LessonProseResult{
  cacheKey:string;
  model:string;
  probabilities:{proseIsUnderstandable:number;requiresUnexplainedGrammarJargon:number;incidentalVocabularyIsBarrier:number};
  route:"pass"|"review"|"likely_rewrite";
  riskProbability:number;
  usage:{inputTokens:number;outputTokens:number};
  evaluatedAt:string;
}

export function shouldAuditSharedUiCopy(path:string){
  // Accent-pad entries are input controls whose visible value is a glyph, not prose.
  return !/\.exerciseControls\.accents\[\d+\]$/u.test(path);
}

function lessonFieldCategory(field:string){
  if(field==="titleFr"||field==="learnerQuestionFr"||field==="takeawayFr"||field==="boundaryFr")return field;
  if(/^steps\[\d+\]\.explanationFr$/u.test(field))return "step_explanation";
  if(/^practice\[\d+\]\.hintFr$/u.test(field))return "practice_hint";
  if(/^practice\[\d+\]\.explanationFr$/u.test(field))return "practice_explanation";
  return field;
}

interface BundleLesson{
  id:string;status:string;titleFr:string;learnerQuestionFr:string;takeawayFr:string;boundaryFr:string;
  steps:Array<{explanationFr:string;exampleFr:string}>;
  practice:Array<{id:string;promptFr:string;answerFr:string;hintFr:string;explanationFr:string}>;
}

interface Bundle{releaseId:string;checksum:string;sourceKind:string;teachingContent:BundleLesson[]}

const WORD_CHARACTER=/[\p{L}\p{M}\p{N}]/u;

function abstractAnswerFromFeedback(text:string,answer:string){
  const exactAnswer=answer.trim();
  if(!exactAnswer)return {auditText:text,excludedTaskText:null};
  const answerEndsWithWord=WORD_CHARACTER.test(exactAnswer.at(-1)??"");
  if(text.startsWith(exactAnswer)&&(!answerEndsWithWord||!WORD_CHARACTER.test(text[exactAnswer.length]??""))){
    const remainder=text.slice(exactAnswer.length).trim();
    return {auditText:remainder,excludedTaskText:exactAnswer};
  }
  let cursor=0,changed=false,result="";
  while(cursor<text.length){
    const index=text.indexOf(exactAnswer,cursor);
    if(index<0){result+=text.slice(cursor);break;}
    const before=index>0?text[index-1]:"",after=text[index+exactAnswer.length]??"";
    const startsWithWord=WORD_CHARACTER.test(exactAnswer[0]??"");
    const endsWithWord=WORD_CHARACTER.test(exactAnswer.at(-1)??"");
    if((startsWithWord&&WORD_CHARACTER.test(before))||(endsWithWord&&WORD_CHARACTER.test(after))){
      result+=text.slice(cursor,index+exactAnswer.length);cursor=index+exactAnswer.length;continue;
    }
    result+=`${text.slice(cursor,index)}« … »`;cursor=index+exactAnswer.length;changed=true;
  }
  return {auditText:changed?result:text,excludedTaskText:changed?exactAnswer:null};
}

function abstractPracticeFeedback(explanation:string,prompt:string,answer:string){
  const blankParagraph=prompt.split(/\n\s*\n/u).map(part=>part.trim()).find(part=>part.includes("___"));
  const colonIndex=blankParagraph?.lastIndexOf(":",blankParagraph.indexOf("___"))??-1;
  const taskCandidates=blankParagraph
    ?[blankParagraph,...(colonIndex>=0?[blankParagraph.slice(colonIndex+1).trim()]:[])]
      .map(candidate=>candidate.replaceAll("___",answer.trim()))
    :[];
  const completedTask=taskCandidates.find(candidate=>explanation.startsWith(candidate));
  const withoutEcho=completedTask&&explanation.startsWith(completedTask)
    ?explanation.slice(completedTask.length).trim()
    :explanation;
  const abstracted=abstractAnswerFromFeedback(withoutEcho,answer);
  return {
    auditText:abstracted.auditText,
    excludedTaskText:[completedTask&&withoutEcho!==explanation?completedTask:null,abstracted.excludedTaskText].filter(Boolean).join("\n\n")||null,
  };
}

export async function extractLessonProse(repositoryRoot:string,bundlePath="tmp/jev-published-v43-bundle.json"){
  const bundle=JSON.parse(await readFile(resolve(repositoryRoot,bundlePath),"utf8")) as Bundle;
  if(bundle.sourceKind!=="runtime_validated_published_bundle")throw new Error(`Unexpected published bundle source kind: ${bundle.sourceKind}`);
  const items:LessonProseItem[]=[];
  const add=(lesson:BundleLesson,field:string,text:string,excludedTaskText:string|null=null,auditOverride:string|null=null)=>{
    if(!text?.trim())return;
    const auditText=auditOverride??(excludedTaskText&&text.startsWith(excludedTaskText)?text.slice(excludedTaskText.length).trim():text);
    // A practice explanation that only repeats the answer contains no feedback prose to assess.
    if(!/[\p{L}\p{M}\p{N}]/u.test(auditText))return;
    items.push({
      id:`published-lesson-prose:${lesson.id}:${field}`,lessonId:lesson.id,field,
      exactText:text,auditText,excludedTaskText,sourcePath:bundlePath,
      sourceStatus:`Published runtime snapshot releaseId=${bundle.releaseId}; checksum=${bundle.checksum}; teachingStatus=${lesson.status}`,
    });
  };
  for(const lesson of bundle.teachingContent){
    add(lesson,"titleFr",lesson.titleFr);
    add(lesson,"learnerQuestionFr",lesson.learnerQuestionFr);
    lesson.steps.forEach((step,index)=>add(lesson,`steps[${index}].explanationFr`,step.explanationFr));
    add(lesson,"takeawayFr",lesson.takeawayFr);
    add(lesson,"boundaryFr",lesson.boundaryFr);
    lesson.practice.forEach((practice,index)=>{
      add(lesson,`practice[${index}].hintFr`,practice.hintFr);
      const feedback=abstractPracticeFeedback(practice.explanationFr,practice.promptFr,practice.answerFr);
      add(lesson,`practice[${index}].explanationFr`,practice.explanationFr,feedback.excludedTaskText,feedback.auditText);
    });
  }
  return items;
}

export function lessonProseCacheKey(item:LessonProseItem,model:string){
  return createHash("sha256").update(JSON.stringify({
    rubric:LESSON_PROSE_RUBRIC_VERSION,
    model,
    state:{
      target_reader:"French-speaking student around grade 5 who may not know grammar jargon",
      lesson_text:item.auditText,
      field:lessonFieldCategory(item.field),
      scope_rule:"Judge plain-language comprehension of the explanation. Do not lower the difficulty of the grammar concept being taught. Ellipses replace quoted task material and are not student-facing vocabulary.",
    },
    questions:LESSON_PROSE_QUESTIONS,
  })).digest("hex");
}

export async function evaluateLessonProse(client:JevClient,item:LessonProseItem):Promise<Omit<LessonProseResult,"cacheKey">>{
  const payload:JevResponse=await client.systemOne({
    target_reader:"French-speaking student around grade 5 who may not know grammar jargon",
    lesson_text:item.auditText,
    field:lessonFieldCategory(item.field),
    scope_rule:"Judge plain-language comprehension of the explanation. Do not lower the difficulty of the grammar concept being taught. Ellipses replace quoted task material and are not student-facing vocabulary.",
  },LESSON_PROSE_QUESTIONS);
  const probabilities={
    proseIsUnderstandable:readNoul(payload,"prose_is_understandable"),
    requiresUnexplainedGrammarJargon:readNoul(payload,"requires_unexplained_grammar_jargon"),
    incidentalVocabularyIsBarrier:readNoul(payload,"incidental_vocabulary_is_barrier"),
  };
  const riskProbability=Math.max(1-probabilities.proseIsUnderstandable,probabilities.requiresUnexplainedGrammarJargon,probabilities.incidentalVocabularyIsBarrier);
  const route=riskProbability<.4?"pass":item.field==="titleFr"||item.field==="learnerQuestionFr"||riskProbability<.75?"review":"likely_rewrite";
  return {
    model:payload.model,probabilities,riskProbability,
    route,
    usage:{inputTokens:payload.usage?.input_tokens??0,outputTokens:payload.usage?.output_tokens??0},
    evaluatedAt:new Date().toISOString(),
  };
}
