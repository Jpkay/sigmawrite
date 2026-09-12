import {checksum} from "../../src/lib/taxonomy/validate";
import type {WritingRubric} from "../../src/lib/diagnostic/granular/writing-rubric";
/** Synthetic responses only. A smoke check is not educator calibration or release approval. */
import {readFileSync,writeFileSync} from "node:fs";
import {createWritingEvaluator,requestWritingJudgment} from "../../src/lib/diagnostic/granular/writing-evaluator";
import {FRENCH_TAXONOMY_V3_CANDIDATE} from "../../src/lib/taxonomy/french-v3";
import {resolveAIRuntimeConfig} from "../../src/lib/ai/runtime-config";
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
let rawJudgment:unknown,rawResponse:string|undefined;
const evaluate=createWritingEvaluator(async input=>{rawJudgment=await requestWritingJudgment(input,raw=>{rawResponse=raw;});return rawJudgment;});
const cases:Array<{id:string;node:string;prompt:string;answer:string;firstDraft?:string;expect:string;rubric?:WritingRubric}>=[
 {id:"correct-imparfait",node:"employer_imparfait_en_contexte",prompt:"Décris les habitudes d’un personnage autrefois.",answer:"Chaque été, Lina jouait dehors. Elle retrouvait ses amis et ils exploraient le jardin.",expect:"correct"},
 {id:"incorrect-imparfait",node:"employer_imparfait_en_contexte",prompt:"Décris les habitudes d’un personnage autrefois.",answer:"Chaque été, Lina jouais dehors. Elle retrouvais ses amis et ils explorait le jardin.",expect:"incorrect"},
 {id:"valid-alternative",node:"employer_passe_recent_en_contexte",prompt:"Envoie un message juste après une découverte.",answer:"J’ai découvert un petit jardin caché. Je suis très content et je t’envoie une photo.",expect:"unresolved"},
 {id:"spelling-revision",node:"reviser_orthographe_lexicale_paragraphe",prompt:"Raconte une découverte puis relis ton texte.",firstDraft:"Dans le jardin, j’ai trouvé un chevale. Il se cachait derrière une barière.",answer:"Dans le jardin, j’ai trouvé un cheval. Il se cachait derrière une barrière.",expect:"correct"},
];
const imperative=process.argv[2]==="imperative";
const counterexamples=process.argv[2]==="counterexamples";
const adversarial=process.argv[2]==="adversarial",targets=process.argv[2]==="targets",scoped=process.argv[2]==="scoped";
const available:typeof cases=imperative?JSON.parse(readFileSync("docs/diagnostic/writing/evaluator-imperative-cases.json","utf8")):counterexamples?JSON.parse(readFileSync("docs/diagnostic/writing/evaluator-counterexample-cases.json","utf8")):scoped?JSON.parse(readFileSync("docs/diagnostic/writing/evaluator-scoped-cases.json","utf8")):targets?JSON.parse(readFileSync("docs/diagnostic/writing/evaluator-target-cases.json","utf8")):adversarial?JSON.parse(readFileSync("docs/diagnostic/writing/evaluator-adversarial-cases.json","utf8")):cases.filter(c=>!process.argv[2]||c.id===process.argv[2]);
const caseId=process.argv.find(arg=>arg.startsWith("--case="))?.slice(7);
const selected=caseId?available.filter(c=>c.id===caseId):available;
if(!selected.length)throw Error("No selected evaluator cases");
const config=resolveAIRuntimeConfig(),results=[];
for(const c of selected){
 rawJudgment=undefined;rawResponse=undefined;
 try{
  const result=await evaluate({skillId:`${c.node}::writing-independent-production`,item:{...bank.items[0].item,nodeKey:c.node,promptFr:c.prompt,instructionsFr:null,...(c.rubric?{validatorConfig:{writingRubric:c.rubric}}:{})},answer:c.answer,...(c.firstDraft?{firstDraft:c.firstDraft}:{})});
  const correct=result.tokens.filter(t=>t.correct).length,total=result.tokens.length;
  const observed=!result.connectedWriting||!total?"unresolved":correct/total>=Number(FRENCH_TAXONOMY_V3_CANDIDATE.nodes.find(n=>n.key===c.node)?.evidence.find(e=>e.expectation==="independent_production")?.successCriteria.minimumAccuracy??.8)?"correct":"incorrect";
  results.push({id:c.id,caseChecksum:checksum(c),expected:c.expect,observed,matched:observed===c.expect,result});
  console.log(JSON.stringify({id:c.id,expected:c.expect,observed,matched:observed===c.expect}));
 }catch(error){
  const cause=error instanceof Error?error.cause:undefined;
  const message=cause instanceof Error?cause.message:"";
  const httpStatus=message.match(/^LLM (\d{3}) /)?.[1];
  const reason=httpStatus?`provider_http_${httpStatus}`:cause instanceof Error&&cause.name==="UnsupportedWritingImperativeError"?"unsupported_morphology":(cause instanceof SyntaxError||/Could not extract JSON/.test(message))?"invalid_json":/response had no content/.test(message)?"empty_provider_response":/timeout|timed out|abort/i.test(message)?"timeout":/Uncertain writing judgment/.test(message)?"uncertain":/excerpt unavailable|Overlapping writing|outside rubric/.test(message)?"invalid_evidence":cause instanceof Error&&cause.name==="ZodError"?"invalid_schema":"provider_or_configuration";
  results.push({id:c.id,caseChecksum:checksum(c),expected:c.expect,observed:"unavailable",reason,causeType:cause instanceof Error?cause.name:typeof cause,rawJudgment,...(reason==="invalid_json"?{rawResponse}:{}),matched:false});console.log(JSON.stringify({id:c.id,observed:"unavailable",reason}));
 }
}
writeFileSync(process.argv.find(arg=>arg.startsWith("--report="))?.slice(9)??(imperative?"docs/diagnostic/writing/evaluator-imperative-report.json":counterexamples?"docs/diagnostic/writing/evaluator-counterexample-report.json":scoped?"docs/diagnostic/writing/evaluator-scoped-report.json":targets?"docs/diagnostic/writing/evaluator-target-report.json":adversarial?"docs/diagnostic/writing/evaluator-adversarial-report.json":process.argv[2]?"docs/diagnostic/writing/evaluator-smoke-detail.json":"docs/diagnostic/writing/evaluator-smoke.json"),JSON.stringify({status:"experimental_not_calibrated",model:process.env.WRITING_GRADING_MODEL??config.model,syntheticOnly:true,casesChecksum:checksum(selected),results},null,2)+"\n");
