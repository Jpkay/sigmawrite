import {createHash} from "node:crypto";
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

import {splitExercisePrompt} from "../../src/lib/content/exercise-prompt";

export const JEV_RUBRIC_VERSION="sigmawrite-french-instruction-readability-v1";
export const DEFAULT_MODEL="jev-latest";
export const DEFAULT_CONCURRENCY=4;

export const SOURCE_DETAILS={
  "published-bundle":{
    label:"Runtime-validated published diagnostic bundle snapshot",
    path:"tmp/jev-published-v43-bundle.json",
    releaseStatus:"Published runtime snapshot. The embedded release id and checksum identify the snapshot; a newer release may supersede it.",
  },
  "legacy-v2-artifact":{
    label:"Legacy generated v2 diagnostic bank",
    path:"generated/diagnostic-bank-v2.json",
    releaseStatus:"Legacy repository artifact; not the current published diagnostic.",
  },
  "draft-v3-teaching":{
    label:"V3 teaching review catalogue",
    path:"docs/diagnostic/v3-teaching-review-catalogue.json",
    releaseStatus:"Draft review catalogue (draft_requires_review); not live teaching content.",
  },
  "shared-diagnostic-copy":{
    label:"Static shared diagnostic copy",
    path:"src/components/diagnostic/diagnostic-copy.ts",
    releaseStatus:"Static source copy; runtime state and publication are not inferred.",
  },
} as const;

export type AuditSource=keyof typeof SOURCE_DETAILS;
export type AuditRoute="pass"|"review"|"likely_rewrite";

export interface InstructionAuditItem{
  id:string;
  source:AuditSource;
  sourcePath:string;
  sourceStatus:string;
  surface:"diagnostic_item"|"guided_lesson_exercise"|"shared_diagnostic_copy";
  parentId:string|null;
  skillKey:string|null;
  exactSourceText:Record<string,string>;
  auditSegments:string[];
  separationNote:"recognized_reading"|"recognized_task_split"|"single_paragraph"|"mixed_direction_and_task_material"|"not_applicable";
  excludedContent:{kind:"reading_passage"|"task_material";paragraphs:string[]}|null;
}

export interface JevProbabilities{
  actionIsClear:number;
  requiresUnexplainedGrammarJargon:number;
  incidentalVocabularyIsBarrier:number;
}

export interface JevAuditResult{
  cacheKey:string;
  model:string;
  probabilities:JevProbabilities;
  route:AuditRoute;
  riskProbability:number;
  usage:{inputTokens:number;outputTokens:number};
  evaluatedAt:string;
}

interface DiagnosticBank{
  items:Array<{
    itemKey:string;
    item:{nodeKey?:string;promptFr:string;instructionsFr?:string};
  }>;
}

interface PublishedBundle{
  releaseId:string;
  checksum:string;
  sourceKind:string;
  assessment:{probes:Array<{id:string;skillId?:string}>};
  bank:DiagnosticBank;
  teachingContent:Array<{
    id:string;nodeKey?:string;status:string;
    practice:Array<{id:string;promptFr:string}>;
  }>;
}

interface TeachingCatalogue{
  status:string;
  rows:Array<{
    lessonId:string;
    nodeKey?:string;
    content:{practice:Array<{id:string;promptFr:string}>};
  }>;
}

interface CacheFile{
  schemaVersion:1;
  rubricVersion:string;
  entries:Record<string,JevAuditResult>;
}

export interface JevResponse{
  model:string;
  answers:Record<string,{type:string;noul?:number}>;
  usage?:{input_tokens?:number;output_tokens?:number};
}

export interface JevClientOptions{
  apiKey:string;
  endpoint?:string;
  model?:string;
  timeoutMs?:number;
  fetchImpl?:typeof fetch;
  sleep?: (milliseconds:number)=>Promise<void>;
}

export interface RunAuditOptions{
  items:InstructionAuditItem[];
  client:JevClient;
  cachePath:string;
  concurrency:number;
  onProgress?:(completed:number,total:number,item:InstructionAuditItem,fromCache:boolean)=>void;
}

const normalizeParagraphs=(text:string)=>text.split(/\n\s*\n/u).map(part=>part.trim()).filter(Boolean);
const DIRECTION_START=/^(?:Choisis|Classe|Compare|Complète|Conjugue|Corrige|Écris|Entoure|Forme|Identifie|Indique|Lis|Mets|Observe|Recopie|Rédige|Relie|Remplace|Réponds|Réécris|Sélectionne|Souligne|Transforme|Trouve)\b/iu;

const GRAMMAR_CONCEPT=/(?:accord|adjectif|adverbe|article|auxiliaire|cause|complément|conditionnel|conjug|déterminant|féminin|futur|groupe nominal|groupe verbal|imparfait|indicatif|infinitif|masculin|mode|négation|nom|participe|passé|pluriel|pronom|proposition|présent|relative|singulier|subjonctif|subordonnée|sujet|temps|verbe|voix passive)/iu;
/** Keep grammar concepts visible while replacing clearly variable task values for cache reuse. */
export function normalizeAuditWording(text:string){
  return text
    .replace(/«([^»]*)»/gu,(match,raw:string)=>GRAMMAR_CONCEPT.test(raw)?match:"« … »")
    .replace(/“([^”]*)”/gu,(match,raw:string)=>GRAMMAR_CONCEPT.test(raw)?match:"« … »")
    .replace(/\((?:[\p{L}\p{M}'’ -]{1,40})\)/gu,(match)=>{
      const raw=match.slice(1,-1);
      return GRAMMAR_CONCEPT.test(raw)?match:"(…)";
    });
}

function separateInlineBlankTask(text:string){
  const blankIndex=text.indexOf("___");
  if(blankIndex<0)return null;
  const colonIndex=text.lastIndexOf(":",blankIndex);
  if(colonIndex<0)return null;
  const afterBlank=text.slice(blankIndex);
  const trailingMatch=/(?:[.!?]\s+)(?=(?:Choisis|Écris|Indique|Recopie|Réponds|Sélectionne)\b)/iu.exec(afterBlank);
  const trailingIndex=trailingMatch?.index===undefined?text.length:blankIndex+trailingMatch.index+trailingMatch[0].length;
  const taskText=text.slice(colonIndex+1,trailingIndex).trim();
  const grammarParentheticals=[...taskText.matchAll(/\(([^)]*)\)/gu)]
    .map(match=>match[1]).filter(value=>GRAMMAR_CONCEPT.test(value)).map(value=>`(${value})`);
  return {
    auditSegments:[text.slice(0,colonIndex+1).trim(),...grammarParentheticals,...(trailingIndex<text.length?[text.slice(trailingIndex).trim()]:[])].map(normalizeAuditWording),
    separationNote:"recognized_task_split" as const,
    excludedContent:{kind:"task_material" as const,paragraphs:[taskText]},
  };
}

const grammarParentheticals=(text:string)=>[...text.matchAll(/\(([^)]*)\)/gu)]
  .map(match=>match[1]).filter(value=>GRAMMAR_CONCEPT.test(value)).map(value=>`(${value})`);

function separatePrompt(promptFr:string){
  const split=splitExercisePrompt(promptFr);
  if(split.question){
    return {
      auditSegments:[split.instruction!,normalizeAuditWording(split.question)],
      separationNote:"recognized_reading" as const,
      excludedContent:{kind:"reading_passage" as const,paragraphs:split.passage},
    };
  }
  const paragraphs=normalizeParagraphs(promptFr);
  if(paragraphs.length>1&&paragraphs.some(paragraph=>paragraph.includes("___"))){
    const blankParagraphs=paragraphs.filter(paragraph=>paragraph.includes("___"));
    const separateDirections=paragraphs.filter(paragraph=>!paragraph.includes("___")&&(DIRECTION_START.test(paragraph)||paragraph.trim().endsWith("?")));
    if(separateDirections.length>0){
      const inlineParts=new Map(blankParagraphs.map(paragraph=>[paragraph,separateInlineBlankTask(paragraph)]));
      const auditSegments=paragraphs.flatMap(paragraph=>{
        if(separateDirections.includes(paragraph))return [normalizeAuditWording(paragraph)];
        const inline=inlineParts.get(paragraph);
        return inline?.auditSegments??grammarParentheticals(paragraph).map(normalizeAuditWording);
      });
      const excluded=blankParagraphs.flatMap(paragraph=>inlineParts.get(paragraph)?.excludedContent.paragraphs??[paragraph]);
      return {
        auditSegments:[...new Set(auditSegments)],
        separationNote:"recognized_task_split" as const,
        excludedContent:{kind:"task_material" as const,paragraphs:excluded},
      };
    }
  }
  if(paragraphs.length===1){
    const inlineBlank=separateInlineBlankTask(paragraphs[0]);
    if(inlineBlank)return inlineBlank;
  }
  if(paragraphs.length===2){
    const firstIsDirection=DIRECTION_START.test(paragraphs[0]);
    const secondIsQuestion=paragraphs[1].trim().endsWith("?");
    if(firstIsDirection||secondIsQuestion){
      const directionIndexes=firstIsDirection&&secondIsQuestion?[0,1]:firstIsDirection?[0]:[1];
      return {
        auditSegments:directionIndexes.map(index=>normalizeAuditWording(paragraphs[index])),
        separationNote:"recognized_task_split" as const,
        excludedContent:{kind:"task_material" as const,paragraphs:paragraphs.filter((_,index)=>!directionIndexes.includes(index))},
      };
    }
  }
  if(paragraphs.length>1){
    return {
      auditSegments:paragraphs.map(normalizeAuditWording),
      separationNote:"mixed_direction_and_task_material" as const,
      excludedContent:null,
    };
  }
  return {auditSegments:[normalizeAuditWording(promptFr)],separationNote:"single_paragraph" as const,excludedContent:null};
}

export async function extractInstructionItems(
  repositoryRoot:string,
  sources:readonly AuditSource[],
  sharedCopy?:unknown,
  publishedBundlePath=SOURCE_DETAILS["published-bundle"].path,
):Promise<InstructionAuditItem[]>{
  const selected=new Set(sources);
  const items:InstructionAuditItem[]=[];
  if(selected.has("published-bundle")){
    const detail=SOURCE_DETAILS["published-bundle"];
    const bundle=JSON.parse(await readFile(resolve(repositoryRoot,publishedBundlePath),"utf8")) as PublishedBundle;
    if(bundle.sourceKind!=="runtime_validated_published_bundle")throw new Error(`Unexpected published bundle source kind: ${bundle.sourceKind}`);
    const probes=new Map(bundle.assessment.probes.map(probe=>[probe.id,probe]));
    const bundleStatus=`${detail.releaseStatus} releaseId=${bundle.releaseId}; checksum=${bundle.checksum}`;
    let matchedProbes=0;
    for(const row of bundle.bank.items){
      const probe=probes.get(row.itemKey);
      if(!probe)continue;
      matchedProbes++;
      const separated=separatePrompt(row.item.promptFr);
      const supplemental=row.item.instructionsFr?.trim();
      items.push({
        id:`published-bundle:probe:${row.itemKey}`,
        source:"published-bundle",sourcePath:publishedBundlePath,sourceStatus:bundleStatus,
        surface:"diagnostic_item",parentId:row.itemKey,skillKey:probe.skillId??row.item.nodeKey??null,
        exactSourceText:{promptFr:row.item.promptFr,...(supplemental?{instructionsFr:row.item.instructionsFr!}:{})},
        auditSegments:[...separated.auditSegments,...(supplemental?[normalizeAuditWording(supplemental)]:[])],
        separationNote:separated.separationNote,
        excludedContent:separated.excludedContent,
      });
    }
    if(matchedProbes!==probes.size)throw new Error("Published bundle contains a probe without a matching bank item");
    for(const lesson of bundle.teachingContent)for(const exercise of lesson.practice){
      const separated=separatePrompt(exercise.promptFr);
      items.push({
        id:`published-bundle:teaching:${lesson.id}:${exercise.id}`,
        source:"published-bundle",sourcePath:publishedBundlePath,
        sourceStatus:`${bundleStatus}; teachingStatus=${lesson.status}`,
        surface:"guided_lesson_exercise",parentId:lesson.id,skillKey:lesson.nodeKey??null,
        exactSourceText:{promptFr:exercise.promptFr},auditSegments:separated.auditSegments,
        separationNote:separated.separationNote,
        excludedContent:separated.excludedContent,
      });
    }
  }
  if(selected.has("legacy-v2-artifact")){
    const detail=SOURCE_DETAILS["legacy-v2-artifact"];
    const bank=JSON.parse(await readFile(resolve(repositoryRoot,detail.path),"utf8")) as DiagnosticBank;
    for(const row of bank.items){
      const separated=separatePrompt(row.item.promptFr);
      const supplemental=row.item.instructionsFr?.trim();
      items.push({
        id:`legacy-v2-artifact:${row.itemKey}`,
        source:"legacy-v2-artifact",sourcePath:detail.path,sourceStatus:detail.releaseStatus,
        surface:"diagnostic_item",parentId:row.itemKey,skillKey:row.item.nodeKey??null,
        exactSourceText:{promptFr:row.item.promptFr,...(supplemental?{instructionsFr:row.item.instructionsFr!}:{})},
        auditSegments:[...separated.auditSegments,...(supplemental?[normalizeAuditWording(supplemental)]:[])],
        separationNote:separated.separationNote,
        excludedContent:separated.excludedContent,
      });
    }
  }
  if(selected.has("draft-v3-teaching")){
    const detail=SOURCE_DETAILS["draft-v3-teaching"];
    const catalogue=JSON.parse(await readFile(resolve(repositoryRoot,detail.path),"utf8")) as TeachingCatalogue;
    if(catalogue.status!=="draft_requires_review")throw new Error(`Unexpected teaching catalogue status: ${catalogue.status}`);
    for(const row of catalogue.rows)for(const exercise of row.content.practice){
      const separated=separatePrompt(exercise.promptFr);
      items.push({
        id:`draft-v3-teaching:${row.lessonId}:${exercise.id}`,
        source:"draft-v3-teaching",sourcePath:detail.path,sourceStatus:detail.releaseStatus,
        surface:"guided_lesson_exercise",parentId:row.lessonId,skillKey:row.nodeKey??null,
        exactSourceText:{promptFr:exercise.promptFr},auditSegments:separated.auditSegments,
        separationNote:separated.separationNote,
        excludedContent:separated.excludedContent,
      });
    }
  }
  if(selected.has("shared-diagnostic-copy")){
    const detail=SOURCE_DETAILS["shared-diagnostic-copy"];
    if(sharedCopy===undefined)throw new Error("sharedCopy is required when shared-diagnostic-copy is selected");
    for(const [path,text] of flattenStrings(sharedCopy))items.push({
      id:`shared-diagnostic-copy:${path}`,
      source:"shared-diagnostic-copy",sourcePath:detail.path,sourceStatus:detail.releaseStatus,
      surface:"shared_diagnostic_copy",parentId:null,skillKey:null,
      exactSourceText:{text},auditSegments:[text],excludedContent:null,
      separationNote:"not_applicable",
    });
  }
  return items;
}

function flattenStrings(value:unknown,path="DIAGNOSTIC_COPY"):Array<[string,string]>{
  if(typeof value==="string")return [[path,value]];
  if(Array.isArray(value))return value.flatMap((entry,index)=>flattenStrings(entry,`${path}[${index}]`));
  if(value&&typeof value==="object")return Object.entries(value).flatMap(([key,entry])=>flattenStrings(entry,`${path}.${key}`));
  return [];
}

export const JEV_QUESTIONS={
  action_is_clear:{
    type:"noul",
    instructions:"Can a French-speaking student around grade 5 tell exactly what action to take from the direction or question wording? Judge clarity of the requested action only. Ignore how difficult the assessed French skill is.",
    criteria:{true:"The requested action and expected response are understandable.",false:"The student could reasonably be unsure what to do or how to respond."},
  },
  requires_unexplained_grammar_jargon:{
    type:"noul",
    instructions:"Must the student understand a grammar term that is not explained in the direction itself in order to know what action to take? Assume the student may not already know grammar jargon. Ignore terms that are merely the learning target when the action remains clear without knowing their definition.",
    criteria:{true:"Unexplained grammar terminology blocks understanding of the direction.",false:"No unexplained grammar terminology is needed to understand the requested action."},
  },
  incidental_vocabulary_is_barrier:{
    type:"noul",
    instructions:"Does vocabulary used only to give the direction, rather than vocabulary being assessed or quoted task material, make the requested action hard for a grade-5 French reader to understand?",
    criteria:{true:"Incidental direction vocabulary is likely to block comprehension.",false:"Incidental direction vocabulary is age-appropriate and clear."},
  },
} as const;

export function buildJevState(item:InstructionAuditItem){
  return {
    target_reader:"French-speaking student around grade 5 who may not know grammar jargon",
    direction_or_question_wording:item.auditSegments,
    source_surface:item.surface,
    separation_note:item.separationNote,
    normalization_note:"Ellipses inside quotes or parentheses replace variable task material. Do not judge the ellipsis as student-facing vocabulary.",
    scope_rule:"Judge only whether the wording makes the requested action understandable. Do not judge or lower the difficulty of the assessed skill, quoted examples, source passage, sentence to transform, or answer content.",
    excluded_task_content:item.excludedContent?"Task material was intentionally omitted.":"No separately structured task content was included.",
  };
}

export function auditCacheKey(item:InstructionAuditItem,model:string){
  return createHash("sha256").update(JSON.stringify({rubric:JEV_RUBRIC_VERSION,model,state:buildJevState(item),questions:JEV_QUESTIONS})).digest("hex");
}

export function routeProbabilities(probabilities:JevProbabilities):{route:AuditRoute;riskProbability:number}{
  const riskProbability=Math.max(
    1-probabilities.actionIsClear,
    probabilities.requiresUnexplainedGrammarJargon,
    probabilities.incidentalVocabularyIsBarrier,
  );
  const route:AuditRoute=riskProbability>=0.75?"likely_rewrite":riskProbability>=0.4?"review":"pass";
  return {route,riskProbability};
}

export class JevClient{
  readonly model:string;
  private readonly apiKey:string;
  private readonly endpoint:string;
  private readonly timeoutMs:number;
  private readonly fetchImpl:typeof fetch;
  private readonly sleep:(milliseconds:number)=>Promise<void>;

  constructor(options:JevClientOptions){
    if(!options.apiKey.trim())throw new Error("TYPESAFE_API_KEY is required for a live Jev audit");
    this.apiKey=options.apiKey;
    this.endpoint=(options.endpoint??"https://api.typesafe.ai").replace(/\/$/u,"");
    this.model=options.model??DEFAULT_MODEL;
    this.timeoutMs=options.timeoutMs??120_000;
    this.fetchImpl=options.fetchImpl??fetch;
    this.sleep=options.sleep??(milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds)));
  }

  async evaluate(item:InstructionAuditItem):Promise<Omit<JevAuditResult,"cacheKey">>{
    const payload=await this.systemOne(buildJevState(item),JEV_QUESTIONS);
    const probabilities:JevProbabilities={
      actionIsClear:readNoul(payload,"action_is_clear"),
      requiresUnexplainedGrammarJargon:readNoul(payload,"requires_unexplained_grammar_jargon"),
      incidentalVocabularyIsBarrier:readNoul(payload,"incidental_vocabulary_is_barrier"),
    };
    return {
      model:payload.model,probabilities,...routeProbabilities(probabilities),
      usage:{inputTokens:payload.usage?.input_tokens??0,outputTokens:payload.usage?.output_tokens??0},
      evaluatedAt:new Date().toISOString(),
    };
  }

  async systemOne(state:unknown,questions:Record<string,unknown>):Promise<JevResponse>{
    let lastStatus=0;
    for(let attempt=0;attempt<3;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
      try{
        const response=await this.fetchImpl(`${this.endpoint}/v1/systemone`,{
          method:"POST",signal:controller.signal,
          headers:{authorization:`Bearer ${this.apiKey}`,"content-type":"application/json"},
          body:JSON.stringify({state,questions,model:this.model}),
        });
        lastStatus=response.status;
        if(response.ok){
          const payload=await response.json() as JevResponse;
          return payload;
        }
        if(!isRetryable(response.status)||attempt===2)throw new Error(`TypeSafe request failed (HTTP ${response.status})`);
        const retryAfter=Number(response.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,30_000):500*2**attempt);
      }catch(error){
        if(error instanceof Error&&error.message.startsWith("TypeSafe request failed"))throw error;
        if(attempt===2)throw new Error(`TypeSafe request failed after 3 attempts${lastStatus?` (HTTP ${lastStatus})`:""}`,{cause:error});
        await this.sleep(500*2**attempt);
      }finally{clearTimeout(timer);}
    }
    throw new Error("TypeSafe request failed");
  }
}

export function readNoul(payload:JevResponse,key:string){
  const answer=payload.answers?.[key];
  if(answer?.type!=="noul"||typeof answer.noul!=="number"||answer.noul<0||answer.noul>1)throw new Error(`Invalid TypeSafe noul answer: ${key}`);
  return answer.noul;
}

const isRetryable=(status:number)=>status===408||status===429||status>=500;

async function readCache(path:string):Promise<CacheFile>{
  try{
    const parsed=JSON.parse(await readFile(path,"utf8")) as CacheFile;
    if(parsed.schemaVersion===1&&parsed.rubricVersion===JEV_RUBRIC_VERSION&&parsed.entries)return parsed;
  }catch(error){
    if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
  }
  return {schemaVersion:1,rubricVersion:JEV_RUBRIC_VERSION,entries:{}};
}

export async function loadCachedAuditResults(items:InstructionAuditItem[],model:string,cachePath:string){
  const cache=await readCache(cachePath);
  const results=new Map<string,JevAuditResult>();
  for(const item of items){
    const cached=cache.entries[auditCacheKey(item,model)];
    if(cached)results.set(item.id,cached);
  }
  return results;
}

async function writeJsonAtomically(path:string,value:unknown){
  await mkdir(dirname(path),{recursive:true});
  const temporary=`${path}.${process.pid}.tmp`;
  await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,"utf8");
  await rename(temporary,path);
}

export async function runJevAudit(options:RunAuditOptions){
  if(!Number.isInteger(options.concurrency)||options.concurrency<1||options.concurrency>32)throw new Error("concurrency must be an integer from 1 to 32");
  const cache=await readCache(options.cachePath);
  const results=new Map<string,JevAuditResult>();
  const pendingByKey=new Map<string,{items:InstructionAuditItem[];cacheKey:string}>();
  let completed=0;
  for(const item of options.items){
    const cacheKey=auditCacheKey(item,options.client.model),cached=cache.entries[cacheKey];
    if(cached){results.set(item.id,cached);completed++;options.onProgress?.(completed,options.items.length,item,true);}
    else{
      const group=pendingByKey.get(cacheKey);
      if(group)group.items.push(item);else pendingByKey.set(cacheKey,{items:[item],cacheKey});
    }
  }
  const pending=[...pendingByKey.values()];
  let next=0;
  let cacheWrite=Promise.resolve();
  let dirtyGroups=0;
  const workers=Array.from({length:Math.min(options.concurrency,pending.length)},async()=>{
    for(;;){
      const index=next++;
      const work=pending[index];
      if(!work)return;
      const representative=work.items[0];
      const evaluated=await options.client.evaluate(representative);
      const result:JevAuditResult={cacheKey:work.cacheKey,...evaluated};
      for(const item of work.items)results.set(item.id,result);
      cache.entries[work.cacheKey]=result;
      dirtyGroups++;
      if(dirtyGroups>=25){dirtyGroups=0;cacheWrite=cacheWrite.then(()=>writeJsonAtomically(options.cachePath,cache));}
      completed+=work.items.length;
      options.onProgress?.(completed,options.items.length,representative,false);
    }
  });
  const settled=await Promise.allSettled(workers);
  await cacheWrite;
  if(dirtyGroups>0)await writeJsonAtomically(options.cachePath,cache);
  const failed=settled.find(result=>result.status==="rejected");
  if(failed?.status==="rejected")throw failed.reason;
  return results;
}

export function csvEscape(value:unknown){
  const string=typeof value==="string"?value:JSON.stringify(value??"");
  return /[",\n\r]/u.test(string)?`"${string.replaceAll('"','""')}"`:string;
}

export function reportCsv(records:Array<{item:InstructionAuditItem;result:JevAuditResult|null}>){
  const headers=["id","source","source_status","surface","parent_id","skill_key","route","risk_probability","action_is_clear_probability","requires_unexplained_grammar_jargon_probability","incidental_vocabulary_is_barrier_probability","model","audit_segments","exact_source_text","excluded_content"];
  const rows=records.map(({item,result})=>[
    item.id,item.source,item.sourceStatus,item.surface,item.parentId,item.skillKey,result?.route??"pending",result?.riskProbability??"",
    result?.probabilities.actionIsClear??"",result?.probabilities.requiresUnexplainedGrammarJargon??"",result?.probabilities.incidentalVocabularyIsBarrier??"",
    result?.model??"",item.auditSegments,item.exactSourceText,item.excludedContent,
  ].map(csvEscape).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export {writeJsonAtomically};
