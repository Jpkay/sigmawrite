#!/usr/bin/env node
import {writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {mkdir} from "node:fs/promises";

import dotenv from "dotenv";

import {DIAGNOSTIC_COPY} from "../src/components/diagnostic/diagnostic-copy";
import {
  DEFAULT_CONCURRENCY,DEFAULT_MODEL,JEV_QUESTIONS,JEV_RUBRIC_VERSION,JevClient,SOURCE_DETAILS,
  type AuditSource,extractInstructionItems,loadCachedAuditResults,reportCsv,runJevAudit,writeJsonAtomically,
} from "./lib/jev-instruction-audit";

interface CliOptions{
  sources:AuditSource[];dryRun:boolean;cacheOnly:boolean;limit:number|null;idPattern:string|null;
  concurrency:number;model:string;cachePath:string;outBase:string;bundlePath:string;
}

const ROOT=resolve(import.meta.dirname,"..");

function usage(){
  return `Audit French student-facing directions with TypeSafe Jev (read-only).

Usage:
  npm run audit:instructions:jev -- [options]

Options:
  --source <published-bundle|legacy-v2-artifact|draft-v3-teaching>
                            Repeatable (default: published-bundle)
  --bundle <path>           Runtime-validated bundle snapshot (default: tmp/jev-published-v43-bundle.json)
  --dry-run                 Extract and export without calling Jev (no API key required)
  --cache-only              Export cached results and leave misses pending
  --limit <n>               Audit only the first n matching records
  --id-pattern <regex>      Keep IDs matching a JavaScript regular expression
  --concurrency <1-32>      Concurrent Jev requests (default: ${DEFAULT_CONCURRENCY})
  --model <id>              TypeSafe model or alias (default: ${DEFAULT_MODEL})
  --cache <path>            Resume cache (default: output/jev-instruction-audit-cache.json)
  --out <base-path>         Report path without .json/.csv
  --help                    Show this help
`;
}

function valueAfter(args:string[],index:number,flag:string){
  const value=args[index+1];
  if(!value||value.startsWith("--"))throw new Error(`${flag} requires a value`);
  return value;
}

export function parseArgs(args:string[]):CliOptions{
  const sources:AuditSource[]=[];
  let dryRun=false,cacheOnly=false,limit:number|null=null,idPattern:string|null=null,concurrency=DEFAULT_CONCURRENCY,model=DEFAULT_MODEL;
  let cachePath=resolve(ROOT,"output/jev-instruction-audit-cache.json");
  let bundlePath="tmp/jev-published-v43-bundle.json";
  const stamp=new Date().toISOString().replaceAll(":","-").replace(/\.\d{3}Z$/u,"Z");
  let outBase=resolve(ROOT,`output/jev-instruction-audit-${stamp}`);
  for(let index=0;index<args.length;index++){
    const arg=args[index];
    if(arg==="--help"){process.stdout.write(usage());process.exit(0);}
    if(arg==="--dry-run"){dryRun=true;continue;}
    if(arg==="--cache-only"){cacheOnly=true;continue;}
    if(arg==="--source"){
      const value=valueAfter(args,index,arg) as AuditSource;index++;
      if(!(value in SOURCE_DETAILS))throw new Error(`Unknown source: ${value}`);
      if(value==="shared-diagnostic-copy")throw new Error("Shared diagnostic UI strings are not all instructions. Use npm run audit:diagnostic-ui:jev for the comprehension audit.");
      if(!sources.includes(value))sources.push(value);
      continue;
    }
    if(arg==="--limit"){
      limit=Number(valueAfter(args,index,arg));index++;
      if(!Number.isInteger(limit)||limit<1)throw new Error("--limit must be a positive integer");
      continue;
    }
    if(arg==="--id-pattern"){idPattern=valueAfter(args,index,arg);index++;continue;}
    if(arg==="--concurrency"){
      concurrency=Number(valueAfter(args,index,arg));index++;
      if(!Number.isInteger(concurrency)||concurrency<1||concurrency>32)throw new Error("--concurrency must be an integer from 1 to 32");
      continue;
    }
    if(arg==="--model"){model=valueAfter(args,index,arg);index++;continue;}
    if(arg==="--bundle"){bundlePath=valueAfter(args,index,arg);index++;continue;}
    if(arg==="--cache"){cachePath=resolve(ROOT,valueAfter(args,index,arg));index++;continue;}
    if(arg==="--out"){outBase=resolve(ROOT,valueAfter(args,index,arg));index++;continue;}
    throw new Error(`Unknown option: ${arg}`);
  }
  if(dryRun&&cacheOnly)throw new Error("Choose either --dry-run or --cache-only");
  return {sources:sources.length?sources:["published-bundle"],dryRun,cacheOnly,limit,idPattern,concurrency,model,cachePath,outBase,bundlePath};
}

async function main(){
  const options=parseArgs(process.argv.slice(2));
  dotenv.config({path:resolve(ROOT,".env.local"),quiet:true});
  dotenv.config({path:resolve(ROOT,".env"),quiet:true});
  let items=await extractInstructionItems(ROOT,options.sources,options.sources.includes("shared-diagnostic-copy")?DIAGNOSTIC_COPY:undefined,options.bundlePath);
  if(options.idPattern){
    let pattern:RegExp;
    try{pattern=new RegExp(options.idPattern,"u");}catch{throw new Error(`Invalid --id-pattern regular expression: ${options.idPattern}`);}
    items=items.filter(item=>pattern.test(item.id));
  }
  if(options.limit!==null)items=items.slice(0,options.limit);
  if(items.length===0)throw new Error("No instruction records matched the selected scope");

  let results=new Map();
  if(options.cacheOnly)results=await loadCachedAuditResults(items,options.model,options.cachePath);
  else if(!options.dryRun){
    const apiKey=process.env.TYPESAFE_API_KEY;
    if(!apiKey)throw new Error("TYPESAFE_API_KEY is missing. Add it to .env.local or the process environment, or use --dry-run.");
    const client=new JevClient({apiKey,endpoint:process.env.TYPESAFE_ENDPOINT,model:options.model});
    let lastLogged=0;
    results=await runJevAudit({items,client,cachePath:options.cachePath,concurrency:options.concurrency,onProgress:(done,total,item,fromCache)=>{
      if(done===total||done-lastLogged>=100){lastLogged=done;process.stderr.write(`[${done}/${total}] ${fromCache?"cache":"Jev"} ${item.id}\n`);}
    }});
  }
  const routeRank={likely_rewrite:0,review:1,pass:2,pending:3} as const;
  const records=items.map(item=>({item,result:results.get(item.id)??null})).sort((a,b)=>{
    const routeA=a.result?.route??"pending",routeB=b.result?.route??"pending";
    return routeRank[routeA]-routeRank[routeB]||(b.result?.riskProbability??-1)-(a.result?.riskProbability??-1)||a.item.id.localeCompare(b.item.id);
  });
  const counts={pending:0,pass:0,review:0,likely_rewrite:0};
  for(const record of records)counts[record.result?.route??"pending"]++;
  const templateGroups=new Map<string,{auditSegments:string[];route:string;riskProbability:number;ids:string[]}>();
  for(const record of records){
    if(!record.result||record.result.route==="pass")continue;
    const existing=templateGroups.get(record.result.cacheKey);
    if(existing)existing.ids.push(record.item.id);
    else templateGroups.set(record.result.cacheKey,{auditSegments:record.item.auditSegments,route:record.result.route,riskProbability:record.result.riskProbability,ids:[record.item.id]});
  }
  const templateQueue=[...templateGroups.values()].sort((a,b)=>b.ids.length-a.ids.length||b.riskProbability-a.riskProbability);
  const report={
    schemaVersion:1,generatedAt:new Date().toISOString(),dryRun:options.dryRun,
    scope:{
      sources:options.sources.map(source=>({source,...SOURCE_DETAILS[source]})),recordCount:items.length,idPattern:options.idPattern,limit:options.limit,
      publishedSnapshot:options.sources.includes("published-bundle")?{
        path:options.bundlePath,
        releaseId:/releaseId=([^;]+)/u.exec(items.find(item=>item.source==="published-bundle")?.sourceStatus??"")?.[1]??null,
        checksum:/checksum=([^;]+)/u.exec(items.find(item=>item.source==="published-bundle")?.sourceStatus??"")?.[1]??null,
      }:null,
    },
    caveats:[
      "The published source is a runtime-validated bundle snapshot identified by release id and checksum. Re-export it before use if a newer release may exist.",
      "Refresh a published snapshot with: node --conditions=react-server --import tsx scripts/export-published-granular-bundle.mts <release-key> <new-output-path>.",
      "The v3 teaching catalogue is draft_requires_review and must not be described as live content.",
      "Jev is strongest in English and TypeSafe documents lower accuracy for other languages. Sample passing French items before broad correction work.",
      "Routes concern direction readability only. They do not assess or change the difficulty of the French skill, passage, or task material.",
      "This audit never edits student-facing copy.",
    ],
    rubric:{version:JEV_RUBRIC_VERSION,targetReader:"French-speaking grade-5 student who may not know grammar jargon",questions:JEV_QUESTIONS,routing:{likelyRewriteRiskAtLeast:0.75,reviewRiskAtLeast:0.4,risk:"max(1 - action_is_clear, unexplained_grammar_jargon, incidental_vocabulary_barrier)"}},
    requestedModel:options.dryRun?null:options.model,summary:{...counts,evaluated:records.length-counts.pending,uniqueFlaggedTemplates:templateQueue.length},
    templateQueue:templateQueue.map(group=>({...group,occurrenceCount:group.ids.length})),
    correctionQueue:records.filter(record=>record.result&&record.result.route!=="pass").map(record=>({id:record.item.id,route:record.result!.route,riskProbability:record.result!.riskProbability})),
    records:records.map(({item,result})=>({...item,evaluation:result})),
  };
  await mkdir(dirname(options.outBase),{recursive:true});
  await writeJsonAtomically(`${options.outBase}.json`,report);
  await writeFile(`${options.outBase}.csv`,reportCsv(records),"utf8");
  process.stdout.write(`${options.dryRun?"Dry-run extraction":"Jev audit"}: ${items.length} records\nJSON: ${options.outBase}.json\nCSV: ${options.outBase}.csv\nRoutes: ${JSON.stringify(counts)}\n`);
}

main().catch(error=>{process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=1;});
