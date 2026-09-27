#!/usr/bin/env node
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

import dotenv from "dotenv";

import {JevClient,csvEscape} from "./lib/jev-instruction-audit";
import {LESSON_PROSE_QUESTIONS,LESSON_PROSE_RUBRIC_VERSION,evaluateLessonProse,extractLessonProse,lessonProseCacheKey,type LessonProseResult} from "./lib/jev-lesson-prose-audit";

const ROOT=resolve(import.meta.dirname,"..");
const args=process.argv.slice(2);
const value=(flag:string,fallback:string)=>{const index=args.indexOf(flag);return index<0?fallback:(args[index+1]??(()=>{throw new Error(`${flag} requires a value`);})());};
const dryRun=args.includes("--dry-run"),cacheOnly=args.includes("--cache-only"),limit=Number(value("--limit","0")),concurrency=Number(value("--concurrency","4"));
const bundle=value("--bundle","tmp/jev-published-v43-bundle.json"),cachePath=resolve(ROOT,value("--cache","output/jev-v43-lesson-prose-cache.json"));
const outBase=resolve(ROOT,value("--out","output/jev-v43-lesson-prose"));
if(!Number.isInteger(concurrency)||concurrency<1||concurrency>64)throw new Error("--concurrency must be an integer from 1 to 64");
if(dryRun&&cacheOnly)throw new Error("Choose either --dry-run or --cache-only");

function fieldPriority(field:string){
  if(field.startsWith("steps["))return 0;
  if(field==="takeawayFr")return 1;
  if(field==="boundaryFr")return 2;
  if(field==="learnerQuestionFr")return 3;
  if(field==="titleFr")return 4;
  if(field.includes(".hintFr"))return 5;
  return 6;
}

async function atomic(path:string,value:unknown){await mkdir(dirname(path),{recursive:true});const temp=`${path}.${process.pid}.tmp`;await writeFile(temp,`${JSON.stringify(value,null,2)}\n`);await rename(temp,path);}

async function main(){
  dotenv.config({path:resolve(ROOT,".env.local"),quiet:true});
  let items=await extractLessonProse(ROOT,bundle);if(limit>0)items=items.slice(0,limit);
  let entries:Record<string,LessonProseResult>={};
  try{const cache=JSON.parse(await readFile(cachePath,"utf8"));if(cache.rubricVersion===LESSON_PROSE_RUBRIC_VERSION)entries=cache.entries??{};}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  if(!dryRun&&!cacheOnly){
    if(!process.env.TYPESAFE_API_KEY)throw new Error("TYPESAFE_API_KEY is missing. Add it to .env.local or use --dry-run.");
    const client=new JevClient({apiKey:process.env.TYPESAFE_API_KEY,endpoint:process.env.TYPESAFE_ENDPOINT});
    const groups=new Map<string,typeof items>();for(const item of items){const key=lessonProseCacheKey(item,client.model);if(!entries[key])groups.set(key,[...(groups.get(key)??[]),item]);}
    const work=[...groups.entries()].sort((a,b)=>fieldPriority(a[1][0].field)-fieldPriority(b[1][0].field));let next=0,completed=items.length-work.reduce((sum,[,group])=>sum+group.length,0),dirty=0,cacheWrite=Promise.resolve();
    const workers=Array.from({length:Math.min(concurrency,work.length)},async()=>{for(;;){
      const current=work[next++];if(!current)return;const [key,group]=current;
      entries[key]={cacheKey:key,...await evaluateLessonProse(client,group[0])};completed+=group.length;dirty++;
      if(dirty>=25){dirty=0;cacheWrite=cacheWrite.then(()=>atomic(cachePath,{schemaVersion:1,rubricVersion:LESSON_PROSE_RUBRIC_VERSION,entries}));}
      if(completed%100<group.length)process.stderr.write(`[${completed}/${items.length}] Jev lesson prose\n`);
    }});
    const settled=await Promise.allSettled(workers);
    await cacheWrite;
    if(dirty>0)await atomic(cachePath,{schemaVersion:1,rubricVersion:LESSON_PROSE_RUBRIC_VERSION,entries});
    const failed=settled.find(result=>result.status==="rejected");if(failed?.status==="rejected")throw failed.reason;
  }
  const records=items.map(item=>({item,evaluation:entries[lessonProseCacheKey(item,"jev-latest")]??null}));
  const counts={pending:0,pass:0,review:0,likely_rewrite:0};for(const record of records)counts[record.evaluation?.route??"pending"]++;
  const firstStatus=items[0]?.sourceStatus??"";
  const report={
    schemaVersion:1,generatedAt:new Date().toISOString(),dryRun,cacheOnly,
    scope:{
      bundle,recordCount:items.length,
      publishedSnapshot:{releaseId:/releaseId=([^;]+)/u.exec(firstStatus)?.[1]??null,checksum:/checksum=([^;]+)/u.exec(firstStatus)?.[1]??null},
    },
    caveats:[
      "This is a named runtime-validated bundle snapshot. Re-export it before use if a newer release may exist.",
      "Refresh a snapshot with: node --conditions=react-server --import tsx scripts/export-published-granular-bundle.mts <release-key> <new-output-path>.",
      "Jev is strongest in English and TypeSafe documents lower accuracy for other languages; sample passing French prose before broad edits.",
      "Titles and learner questions are capped at review because adjacent lesson steps may explain their terms.",
      "Quoted examples, exercise prompts, and exact answers are excluded from prose scoring where the structure can be identified.",
    ],
    rubric:{version:LESSON_PROSE_RUBRIC_VERSION,questions:LESSON_PROSE_QUESTIONS},summary:counts,records,
  };
  await atomic(`${outBase}.json`,report);
  const header=["id","lesson_id","field","route","risk_probability","prose_is_understandable_probability","requires_unexplained_grammar_jargon_probability","incidental_vocabulary_is_barrier_probability","exact_text"];
  const rows=records.map(({item,evaluation})=>[item.id,item.lessonId,item.field,evaluation?.route??"pending",evaluation?.riskProbability??"",evaluation?.probabilities.proseIsUnderstandable??"",evaluation?.probabilities.requiresUnexplainedGrammarJargon??"",evaluation?.probabilities.incidentalVocabularyIsBarrier??"",item.exactText].map(csvEscape).join(","));
  await writeFile(`${outBase}.csv`,`${header.join(",")}\n${rows.join("\n")}\n`);
  process.stdout.write(`Lesson prose audit: ${items.length} records ${JSON.stringify(counts)}\nJSON: ${outBase}.json\nCSV: ${outBase}.csv\n`);
}
main().catch(error=>{process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=1;});
