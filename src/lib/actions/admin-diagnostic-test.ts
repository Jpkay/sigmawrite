'use server';
import {requireRole} from '@/lib/auth';
import {createServiceClient} from '@/lib/supabase/server';
import {sharedReleaseContentCache} from '@/lib/diagnostic/granular/release-content-cache';
import {SupabaseAssessmentStore} from '@/lib/diagnostic/granular/store';
import {PreviewAssessmentStore,newPreviewState,signPreviewState,verifyPreviewState} from '@/lib/diagnostic/granular/admin-preview';
import {createSession} from '@/lib/diagnostic/granular/session';
import {bindAssessmentRelease} from '@/lib/diagnostic/granular/release-binding';
import {publicAssessmentView,runAssessmentCommand} from '@/lib/diagnostic/granular/service';
import {runLearningCheckCommand} from '@/lib/diagnostic/granular/learning-service';
import {runTeachingCommand} from '@/lib/diagnostic/granular/teaching-service';
import {createWritingEvaluator} from '@/lib/diagnostic/granular/writing-evaluator';
import {span,timedStore,traceCommandDetailed} from '@/lib/diagnostic/granular/latency-trace';
import type {AssessmentResponse} from '@/lib/diagnostic/granular/client-state';

const releaseKey=()=>process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY??'french-granular-diagnostic-v1';
const previewError=(error:unknown)=>({error:error instanceof Error?error.message:'Le test a échoué.'});
function releases(){return timedStore(new SupabaseAssessmentStore(createServiceClient(),{cache:sharedReleaseContentCache,namespace:process.env.NEXT_PUBLIC_SUPABASE_URL!}));}
export type AdminDiagnosticTestResult=AssessmentResponse&{token?:string;releaseKey?:string;server?:{command:string;totalMs:number;spans:{name:string;startMs:number;ms:number}[]}};

export async function startAdminDiagnosticTest():Promise<AdminDiagnosticTestResult>{
 const {result,server}=await traceCommandDetailed('test:start',async()=>{
  const admin=await span('auth.role',()=>requireRole(['platform_admin']));
  try{
   const store=releases();
   const id=await span('release.lookup',()=>store.publishedReleaseId(releaseKey()));
   if(!id)return {error:'Aucun diagnostic publié n’est disponible.'};
   const bundle=await span('release.load',()=>store.release(id));
   if(!bundle)return {error:'Le diagnostic publié est indisponible.'};
   const state=newPreviewState(admin.id,id,createSession(bindAssessmentRelease(bundle.assessment,bundle)));
   return {view:await span('view',()=>publicAssessmentView(state.session,bundle)),token:signPreviewState(state),releaseKey:releaseKey()};
  }catch(error){return previewError(error);}
 });
 return {...result,server};
}

export async function updateAdminDiagnosticTest(input:{token:string;command:unknown;kind:'diagnostic'|'learning'|'teaching'}):Promise<AdminDiagnosticTestResult>{
 const label=input?.command&&typeof input.command==='object'&&'type'in input.command&&typeof input.command.type==='string'?input.command.type:'unknown';
 const {result,server}=await traceCommandDetailed(`test:${input?.kind??'unknown'}:${label}`,async()=>{
  const admin=await span('auth.role',()=>requireRole(['platform_admin']));
  try{
   if(!input||!['diagnostic','learning','teaching'].includes(input.kind))return {error:'Commande de test invalide.'};
   const state=await span('token.verify',()=>verifyPreviewState(input.token,admin.id));
   const store=timedStore(new PreviewAssessmentStore(state.session,id=>releases().release(id)));
   const result=await span<AssessmentResponse>('command',async()=>{
    if(input.kind==='diagnostic')return runAssessmentCommand(store,admin.id,input.command);
    if(input.kind==='learning')return runLearningCheckCommand(store,admin.id,input.command,Date.now,process.env.GRANULAR_WRITING_EVALUATION_ENABLED==='true'?async data=>span('writing.provider',()=>createWritingEvaluator()(data)):undefined);
    return runTeachingCommand(store,admin.id,input.command);
   });
   // A failed command retains the previous signed state. Successful mutations
   // sign the request-local copy, never a student row.
   return {...result,token:signPreviewState(state)};
  }catch(error){return previewError(error);}
 });
 return {...result,server};
}
