#!/usr/bin/env node
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

import dotenv from "dotenv";

import {DIAGNOSTIC_COPY} from "../src/components/diagnostic/diagnostic-copy";
import {JevClient,csvEscape} from "./lib/jev-instruction-audit";
import {LESSON_PROSE_QUESTIONS,LESSON_PROSE_RUBRIC_VERSION,evaluateLessonProse,lessonProseCacheKey,shouldAuditSharedUiCopy,type LessonProseItem,type LessonProseResult} from "./lib/jev-lesson-prose-audit";

const ROOT=resolve(import.meta.dirname,"..");
const args=process.argv.slice(2);
const value=(flag:string,fallback:string)=>{const index=args.indexOf(flag);return index<0?fallback:(args[index+1]??(()=>{throw new Error(`${flag} requires a value`);})());};
const dryRun=args.includes("--dry-run"),cacheOnly=args.includes("--cache-only"),concurrency=Number(value("--concurrency","16"));
const cachePath=resolve(ROOT,value("--cache","output/jev-shared-diagnostic-copy-prose-cache.json"));
const outBase=resolve(ROOT,value("--out","output/jev-shared-diagnostic-copy-prose"));
if(dryRun&&cacheOnly)throw new Error("Choose either --dry-run or --cache-only");
if(!Number.isInteger(concurrency)||concurrency<1||concurrency>64)throw new Error("--concurrency must be an integer from 1 to 64");

function flatten(value:unknown,path="DIAGNOSTIC_COPY"):Array<[string,string]>{
  if(typeof value==="string")return [[path,value]];
  if(Array.isArray(value))return value.flatMap((entry,index)=>flatten(entry,`${path}[${index}]`));
  if(value&&typeof value==="object")return Object.entries(value).flatMap(([key,entry])=>flatten(entry,`${path}.${key}`));
  return [];
}

async function atomic(path:string,payload:unknown){
  await mkdir(dirname(path),{recursive:true});const temporary=`${path}.${process.pid}.tmp`;
  await writeFile(temporary,`${JSON.stringify(payload,null,2)}\n`);await rename(temporary,path);
}

async function main(){
  dotenv.config({path:resolve(ROOT,".env.local"),quiet:true});
  const flattened=flatten(DIAGNOSTIC_COPY),excludedNonProse=flattened.filter(([path])=>!shouldAuditSharedUiCopy(path));
  const items:LessonProseItem[]=flattened.filter(([path])=>shouldAuditSharedUiCopy(path)).map(([path,text])=>({
    id:`shared-diagnostic-copy:${path}`,lessonId:"shared-diagnostic-copy",field:"ui_copy",exactText:text,auditText:text,
    excludedTaskText:null,sourcePath:"src/components/diagnostic/diagnostic-copy.ts",
    sourceStatus:"Static source copy; runtime publication state is not inferred.",
  }));
  let entries:Record<string,LessonProseResult>={};
  try{const cache=JSON.parse(await readFile(cachePath,"utf8"));if(cache.rubricVersion===LESSON_PROSE_RUBRIC_VERSION)entries=cache.entries??{};}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  if(!dryRun&&!cacheOnly){
    if(!process.env.TYPESAFE_API_KEY)throw new Error("TYPESAFE_API_KEY is missing. Add it to .env.local or use --dry-run.");
    const client=new JevClient({apiKey:process.env.TYPESAFE_API_KEY,endpoint:process.env.TYPESAFE_ENDPOINT});
    const groups=new Map<string,LessonProseItem[]>();for(const item of items){const key=lessonProseCacheKey(item,client.model);if(!entries[key])groups.set(key,[...(groups.get(key)??[]),item]);}
    const work=[...groups.entries()];let next=0,dirty=0,cacheWrite=Promise.resolve();
    const workers=Array.from({length:Math.min(concurrency,work.length)},async()=>{for(;;){
      const current=work[next++];if(!current)return;const [key,group]=current;
      entries[key]={cacheKey:key,...await evaluateLessonProse(client,group[0])};dirty++;
      if(dirty>=25){dirty=0;cacheWrite=cacheWrite.then(()=>atomic(cachePath,{schemaVersion:1,rubricVersion:LESSON_PROSE_RUBRIC_VERSION,entries}));}
    }});
    const settled=await Promise.allSettled(workers);await cacheWrite;if(dirty>0)await atomic(cachePath,{schemaVersion:1,rubricVersion:LESSON_PROSE_RUBRIC_VERSION,entries});
    const failed=settled.find(result=>result.status==="rejected");if(failed?.status==="rejected")throw failed.reason;
  }
  const records=items.map(item=>({item,evaluation:entries[lessonProseCacheKey(item,"jev-latest")]??null}));
  const summary={pending:0,pass:0,review:0,likely_rewrite:0};for(const record of records)summary[record.evaluation?.route??"pending"]++;
  const report={
    schemaVersion:1,generatedAt:new Date().toISOString(),dryRun,cacheOnly,
    scope:{sourcePath:"src/components/diagnostic/diagnostic-copy.ts",sourceStatus:"Static source copy; runtime publication state is not inferred.",recordCount:items.length,excludedNonProseCount:excludedNonProse.length,excludedNonProsePaths:excludedNonProse.map(([path])=>path)},
    caveats:["This comprehension audit includes labels, headings, feedback, and directions. A flag means the isolated UI string needs contextual review; it is not an automatic rewrite decision.","Accent-pad glyph controls are excluded because their single-character values are input controls rather than prose."],
    rubric:{version:LESSON_PROSE_RUBRIC_VERSION,questions:LESSON_PROSE_QUESTIONS,field:"ui_copy"},summary,records,
  };
  await atomic(`${outBase}.json`,report);
  const header=["id","route","risk_probability","understandable_probability","unexplained_jargon_probability","incidental_vocabulary_probability","exact_text"];
  const rows=records.map(({item,evaluation})=>[item.id,evaluation?.route??"pending",evaluation?.riskProbability??"",evaluation?.probabilities.proseIsUnderstandable??"",evaluation?.probabilities.requiresUnexplainedGrammarJargon??"",evaluation?.probabilities.incidentalVocabularyIsBarrier??"",item.exactText].map(csvEscape).join(","));
  await writeFile(`${outBase}.csv`,`${header.join(",")}\n${rows.join("\n")}\n`);
  process.stdout.write(`Shared diagnostic UI comprehension audit: ${items.length} records ${JSON.stringify(summary)}\nJSON: ${outBase}.json\nCSV: ${outBase}.csv\n`);
}
main().catch(error=>{process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=1;});
