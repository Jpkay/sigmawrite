/** Real home component with controlled async data; no production accounts. */
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const mocks={
 '@/lib/student-store':`import {useSyncExternalStore} from 'react';const listeners=new Set();window.fixtureState={hydrated:false,onboarded:true,diagnostic:null,granularDiagnosticReady:true,interests:[],sessions:[]};window.setFixtureState=patch=>{window.fixtureState={...window.fixtureState,...patch};listeners.forEach(fn=>fn());};export const hasStudentBackend=true;export const useStudentState=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>window.fixtureState);`,
 '@/lib/actions/student':`window.pendingHomes=[];export const loadStudentHome=()=>new Promise(resolve=>window.pendingHomes.push(resolve));export const markBadgesSeen=async()=>{};`,
 '@/components/motivation':`export const BadgeShelf=()=>null,ClassGoalCard=()=>null,WeekStrip=()=>null,WeeklyRecapCard=()=>null;`,
 '@/components/league':`export const LeagueCard=()=>null;`,
 '@/lib/analytics':`export const track=()=>{};`,
 'next/link':`import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{href,...props},children);}`,
};
const output=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/student/home-client';import {HOME_COPY} from './src/app/student/home-copy';import {SEED_TEXTS} from './src/lib/content/texts';import {homeFallbackText} from './src/lib/diagnostic/granular/home-recommendation-display';const root=createRoot(document.getElementById('root'));window.fixtureAssignments=[];window.renderOwner=owner=>root.render(<Home key={owner} copy={HOME_COPY} assignments={window.fixtureAssignments}/>);window.seedMetadata=SEED_TEXTS.map(t=>({title:t.title,interest:t.primaryInterest}));window.fallbackTitle=interests=>homeFallbackText(interests).title;window.resolveHome=(request,index)=>window.pendingHomes[request]({texts:[SEED_TEXTS[index]],plan:[],fallbackPlan:null,motivation:null,resume:null,assessment:null,recap:null,classGoal:null,league:null});window.renderOwner('owner-a');`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js',resolveDir:process.cwd()}));}}]});
const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?output.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByText('Chargement…',{exact:true}).waitFor();
 const metadata=await page.evaluate(()=>window.seedMetadata);const first=metadata[0],second=metadata.find(t=>t.interest!==first.interest);assert.ok(second);
 await page.evaluate(interest=>window.setFixtureState({hydrated:true,interests:[interest]}),second.interest);
 const initial=await page.evaluate(interest=>window.fallbackTitle([interest]),second.interest);
 await page.getByRole('heading',{name:initial,exact:true}).waitFor();
 await page.waitForFunction(()=>window.pendingHomes.length===1);await page.evaluate(()=>window.resolveHome(0,0));await page.getByRole('heading',{name:first.title,exact:true}).waitFor();
 await page.evaluate(()=>window.setFixtureState({interests:[]}));await page.waitForFunction(()=>window.pendingHomes.length===2);
 await page.evaluate(interest=>window.setFixtureState({interests:[interest]}),second.interest);await page.waitForFunction(()=>window.pendingHomes.length===3);
 await page.evaluate(()=>window.resolveHome(1,0));await page.getByRole('heading',{name:initial,exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:first.title,exact:true}).count(),0);
 await page.evaluate(()=>window.resolveHome(2,0));await page.getByRole('heading',{name:first.title,exact:true}).waitFor();
 await page.evaluate(()=>window.renderOwner('owner-b'));await page.getByRole('heading',{name:initial,exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:first.title,exact:true}).count(),0);
 await page.evaluate(()=>{window.fixtureAssignments=[{id:'a',title:'Devoir du compte A',target_type:'text',text_slug:null}];window.renderOwner('owner-a');});await page.getByText('Devoir du compte A',{exact:true}).waitFor();
 await page.evaluate(()=>{window.fixtureAssignments=[{id:'b',title:'Devoir du compte B',target_type:'text',text_slug:null}];window.renderOwner('owner-b');});await page.getByText('Devoir du compte B',{exact:true}).waitFor();assert.equal(await page.getByText('Devoir du compte A',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 const report={fixture:'local-real-home-component',hydratedInterestFallback:true,staleAsyncResultIgnored:true,accountRemountClearsRecommendation:true,assignmentsChangeWithAccount:true,pageErrors:errors,productionVerified:false};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
