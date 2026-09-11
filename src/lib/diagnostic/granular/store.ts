import "server-only";
import type {ReleaseContentCache} from "./release-content-cache";
import {prepareParallelPublication} from "./publication-contract";
import {validateActivityBindings} from "./activity-validation";
import {withKnownMaterialHistory} from "./material-history";
import {parseMaterialReceipt,type MaterialReceipt} from "./material-receipt";
import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentStore,AssessmentBundle,StoredSession} from "./service";
import {createSession,type AssessmentSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {inspectQuestionPools} from "./question-pools";
import {inspectReleaseBank} from "./release-bank";
import {validatePublishedTeaching} from "./teaching-content";
export class SupabaseAssessmentStore implements AssessmentStore{
 // One deterministic validation result per store instance (normally one action).
 // Content and live availability are still fetched and checked on every call.
 private contentValidation:{checksum:string;preflight:ReturnType<typeof prepareParallelPublication>|null}|null=null;
 constructor(private readonly db:SupabaseClient,private readonly immutableContent?:{cache:ReleaseContentCache;namespace:string}){}
 async load(studentId:string,sessionId:string):Promise<StoredSession|null>{
  const {data,error}=await this.db.from("granular_assessment_sessions").select("id,student_id,release_id,state").eq("id",sessionId).eq("student_id",studentId).maybeSingle();
  if(error)throw Error(error.message);
  return data?{id:data.id,studentId:data.student_id,releaseId:data.release_id,state:data.state as AssessmentSession}:null;
 }
 async release(id:string):Promise<AssessmentBundle|null>{
  const query=this.db.from("granular_assessment_releases");
  const result=this.immutableContent
   ?await query.select("content_checksum,taxonomy_release_id,bank_release_id").eq("id",id).eq("status","published").maybeSingle()
   :await query.select("bundle,content_checksum,taxonomy_release_id,bank_release_id").eq("id",id).eq("status","published").maybeSingle();
  const {error}=result;
  let data:{bundle?:AssessmentBundle;content_checksum:string;taxonomy_release_id:string;bank_release_id:string}|null=result.data;
  if(error)throw Error(error.message);if(!data)return null;
  const cacheKey=[this.immutableContent?.namespace??"",id,data.content_checksum,data.taxonomy_release_id,data.bank_release_id];
  const cached=this.immutableContent?.cache.get(cacheKey);
  if(cached)data={...data,bundle:cached.bundle};
  else if(this.immutableContent){
   const full=await this.db.from("granular_assessment_releases").select("bundle,content_checksum,taxonomy_release_id,bank_release_id").eq("id",id).eq("status","published").eq("content_checksum",data.content_checksum).eq("taxonomy_release_id",data.taxonomy_release_id).eq("bank_release_id",data.bank_release_id).maybeSingle();
   if(full.error)throw Error(full.error.message);if(!full.data)return null;data=full.data;
  }
  if(!data.bundle)return null;
  if(!cached&&checksum(data.bundle)!==data.content_checksum)throw Error("Assessment bundle checksum mismatch");
  if(data.bundle?.taxonomyId!==data.taxonomy_release_id||data.bundle?.bankId!==data.bank_release_id)return null;
  // Bundle provenance is immutable, but availability changes when a parent is
  // withdrawn. Recheck live parent rows before returning questions or lessons.
  const [taxonomy,bank]=await Promise.all([
   this.db.from("taxonomy_releases").select("id,manifest_checksum").eq("id",data.taxonomy_release_id).eq("status","published").maybeSingle(),
   this.db.from("diagnostic_item_bank_releases").select("id,manifest_checksum").eq("id",data.bank_release_id).eq("taxonomy_release_id",data.taxonomy_release_id).eq("status","published").maybeSingle(),
  ]);
  if(taxonomy.error)throw Error(taxonomy.error.message);
  if(bank.error)throw Error(bank.error.message);
  if(!taxonomy.data||!bank.data)return null;
  if(!data.bundle?.assessment?.taxonomyChecksum||!data.bundle?.assessment?.bankChecksum
   ||taxonomy.data.manifest_checksum!==data.bundle.assessment.taxonomyChecksum
   ||bank.data.manifest_checksum!==data.bundle.assessment.bankChecksum)return null;
  let validation=cached?{checksum:data.content_checksum,preflight:cached.preflight}:this.contentValidation?.checksum===data.content_checksum?this.contentValidation:null;
  if(!validation){
   let preflight:ReturnType<typeof prepareParallelPublication>|null=null;
   try{
    const bundle=data.bundle as AssessmentBundle;
    if(bundle.activities?.some(binding=>binding.contentId&&!bundle.teachingContent?.some(lesson=>lesson.id===binding.contentId&&lesson.nodeKey===binding.nodeKey&&lesson.facetKey===binding.facetKey&&lesson.mode===binding.mode)))return null;
    if(bundle.assessment.reviewPolicy?.mode==="parallel_review"){
     preflight=prepareParallelPublication(bundle);
     if(!preflight.ready)return null;
    }else{
     // Parallel publication above already validates these immutable structures.
     // Legacy releases still need each check here.
     if(!inspectQuestionPools(bundle.assessment).ok)return null;
     if(!inspectReleaseBank(bundle))return null;
     validateActivityBindings(bundle.assessment,bundle.activities??[]);
     validatePublishedTeaching(bundle.assessment,bundle.teachingContent??[]);
    }
   }catch{return null;}
   validation={checksum:data.content_checksum,preflight};
   this.contentValidation=validation;
  }
  if(data.bundle.assessment.reviewPolicy?.mode==="parallel_review"){
   const preflight=validation.preflight;
   if(!preflight)return null;
   const permission=await this.db.from("granular_bank_publication_permissions").select("preflight,bank_checksum,taxonomy_checksum")
    .eq("bank_release_id",data.bank_release_id).eq("bundle_checksum",data.content_checksum).maybeSingle();
   if(permission.error)throw Error(permission.error.message);
   if(!permission.data||permission.data.bank_checksum!==preflight.bankChecksum
    ||permission.data.taxonomy_checksum!==preflight.taxonomyChecksum||checksum(permission.data.preflight)!==checksum(preflight))return null;
  }
  if(!cached)this.immutableContent?.cache.set(cacheKey,{bundle:data.bundle as AssessmentBundle,preflight:validation.preflight});
  return data.bundle as AssessmentBundle;
 }
 async recordMaterialPresentation(input:{presentationId:string;studentId:string;sourceChecksum:string;materialKeys:string[]}):Promise<void>{
  const {error}=await this.db.rpc("record_student_material_presentation",{p_presentation_id:input.presentationId,p_student_id:input.studentId,p_source_checksum:input.sourceChecksum,p_material_keys:input.materialKeys});
  if(error)throw Error(error.message);
 }
 async loadMaterialReceipt(input:{presentationId:string;studentId:string;sourceChecksum:string;materialKeys:string[]}):Promise<MaterialReceipt|null>{
  const {data,error}=await this.db.rpc("read_student_material_presentation",{p_presentation_id:input.presentationId,p_student_id:input.studentId,p_source_checksum:input.sourceChecksum});
  if(error)throw Error(error.message);
  return parseMaterialReceipt(data,input.materialKeys);
 }
 async knownMaterialKeys(studentId:string,materialKeys:readonly string[]):Promise<string[]>{
  const keys=[...new Set(materialKeys)],found:string[]=[];
  // Bound each RPC below the default API row cap; use POST parameters rather
  // than putting hundreds of material hashes into a query-string filter.
  for(let start=0;start<keys.length;start+=500){
   const batch=keys.slice(start,start+500);
   const {data,error}=await this.db.rpc("known_student_material_keys",{p_student_id:studentId,p_material_keys:batch});
   if(error)throw Error(error.message);
   if(!Array.isArray(data)||data.some(key=>typeof key!=="string"||!batch.includes(key))||new Set(data).size!==data.length)throw Error("Invalid material history response");
   found.push(...data);
  }
  return found;
 }
 async save(studentId:string,sessionId:string,expectedRevision:number,state:AssessmentSession){
  const {data,error}=await this.db.from("granular_assessment_sessions").update({state,revision:state.revision}).eq("id",sessionId).eq("student_id",studentId).eq("revision",expectedRevision).select("id");
  if(error)throw Error(error.message);return data.length===1;
 }
 async latestLearning(studentId:string):Promise<{session:StoredSession;bundle:AssessmentBundle}|null>{
  const {data,error}=await this.db.from("granular_assessment_sessions").select("id,release_id").eq("student_id",studentId).eq("state->>phase","learning").order("updated_at",{ascending:false}).limit(10);
  if(error)throw Error(error.message);
  for(const row of data){const bundle=await this.release(row.release_id);if(!bundle)continue;const session=await this.load(studentId,row.id);if(session&&session.state.completionReason!=="coverage_gap")return {session:await withKnownMaterialHistory(this,session,bundle),bundle};}
  return null;
 }
 /** Resume the student's pinned release even after a newer default is published. */
 async latestSession(studentId:string):Promise<{session:StoredSession;bundle:AssessmentBundle}|null>{
  const {data,error}=await this.db.from("granular_assessment_sessions").select("id,release_id").eq("student_id",studentId).order("updated_at",{ascending:false}).limit(10);
  if(error)throw Error(error.message);
  for(const row of data??[]){
   const bundle=await this.release(row.release_id);if(!bundle)continue;
   const session=await this.load(studentId,row.id);
   if(session)return {session:await withKnownMaterialHistory(this,session,bundle),bundle};
  }
  return null;
 }
 async start(studentId:string,releaseKey:string):Promise<{session:StoredSession;bundle:AssessmentBundle}|null>{
  const {data:release,error}=await this.db.from("granular_assessment_releases").select("id").eq("release_key",releaseKey).eq("status","published").maybeSingle();
  if(error)throw Error(error.message);if(!release)return null;
  const bundle=await this.release(release.id);if(!bundle)return null;
  const find=async()=>{
   const {data,error}=await this.db.from("granular_assessment_sessions").select("id").eq("student_id",studentId).eq("release_id",release.id).maybeSingle();
   if(error)throw Error(error.message);return data?this.load(studentId,data.id):null;
  };
  const existing=await find();if(existing)return {session:await withKnownMaterialHistory(this,existing,bundle),bundle};
  const state=createSession(bindAssessmentRelease(bundle.assessment,{taxonomyId:bundle.taxonomyId,bankId:bundle.bankId}));
  const {data, error:insertError}=await this.db.from("granular_assessment_sessions").insert({student_id:studentId,release_id:release.id,revision:0,state}).select("id").single();
  if(insertError){
   if(insertError.code!=="23505")throw Error(insertError.message);
   const concurrent=await find();if(!concurrent)throw Error("Concurrent session creation failed");return {session:await withKnownMaterialHistory(this,concurrent,bundle),bundle};
  }
  return {session:await withKnownMaterialHistory(this,{id:data.id,studentId,releaseId:release.id,state},bundle),bundle};
 }
}
