import {assertDiagnosticAudioAssets} from './lib/diagnostic-audio-assets';
import {granularBankOptions} from "./lib/granular-bank-options";
/** Operator workflow:
 * node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts export-bank /tmp/french-v3-bank.json
 * DIAGNOSTIC_TAXONOMY_PATH=generated/french-taxonomy-v3.json npx tsx scripts/import-diagnostic-bank-v2.mts /tmp/french-v3-bank.json
 * node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts check
 * DIAGNOSTIC_BANK_PUBLISHER_PROFILE_ID=<admin profile UUID> node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts publish <release-key>
 * Publication does not activate the student feature flag.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {config} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import {prepareParallelPublication} from "../src/lib/diagnostic/granular/publication-contract";
import {verifyRelationalBank} from "../src/lib/diagnostic/granular/relational-bank";
import type {AssessmentBundle} from "../src/lib/diagnostic/granular/service";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const mode=process.argv[2];
if(!["export-bank","check","publish"].includes(mode))throw Error("Expected export-bank <path>, check, or publish <release-key>");
if(mode==="export-bank"&&!process.argv[3])throw Error("Output path is required");
if(mode==="publish"&&!process.argv[3]?.trim())throw Error("An immutable release key is required");
const candidate=read("docs/diagnostic/v3-scoped-review-candidate.json");
const taxonomy=read("generated/french-taxonomy-v3.json");
const {bank}=assembleDraftBank(read("generated/diagnostic-bank-v3-draft.json"),taxonomy.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)),granularBankOptions(process.argv.slice(2)));
assertDiagnosticAudioAssets(bank,undefined,candidate.teachingContent);
const bundle:AssessmentBundle={assessment:candidate.assessment,bank,taxonomyId:"unpublished",bankId:"unpublished",teachingContent:candidate.teachingContent,activities:candidate.activities.map((activity:object)=>({...activity,status:"published"}))};
const prepared=prepareParallelPublication(bundle);
if(!prepared.ready)throw Error("Candidate still has missing instruction or fresh checks");
if(mode==="export-bank"){
 writeFileSync(process.argv[3],JSON.stringify(bank)+"\n",{flag:"wx",mode:0o600});
 console.log(JSON.stringify({exportedItems:bank.items.length,bankChecksum:prepared.bankChecksum,path:process.argv[3]}));
}else{
 config({path:process.env.DIAGNOSTIC_ENV_FILE??".env.local",quiet:true});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error("Supabase service environment is required");
 const db=createClient(url,key,{auth:{persistSession:false}});
 const parentTaxonomy=await db.from("taxonomy_releases").select("id,status,manifest_checksum").eq("release_key",bank.taxonomy.releaseKey).single();
 if(parentTaxonomy.error)throw Error(parentTaxonomy.error.message);
 if(parentTaxonomy.data.status!=="published"||parentTaxonomy.data.manifest_checksum!==prepared.taxonomyChecksum)throw Error("Published approved taxonomy does not match");
 const parentBank=await db.from("diagnostic_item_bank_releases").select("id,status,manifest_checksum,taxonomy_release_id").eq("bank_key",bank.bank.key).single();
 if(parentBank.error)throw Error(`Import the canonical bank first: ${parentBank.error.message}`);
 if(parentBank.data.status==="withdrawn"||parentBank.data.manifest_checksum!==prepared.bankChecksum||parentBank.data.taxonomy_release_id!==parentTaxonomy.data.id)throw Error("Imported bank does not match this candidate");
 bundle.taxonomyId=parentTaxonomy.data.id;bundle.bankId=parentBank.data.id;
 if(mode==="check"){
  const verified=await verifyRelationalBank(db,bundle);
  console.log(JSON.stringify({...prepareParallelPublication(bundle),...verified}));
 }else{
  const {publishParallelAssessment}=await import("../src/lib/diagnostic/granular/publisher");
  const result=await publishParallelAssessment(db,{bundle,releaseKey:process.argv[3],publisherProfileId:process.env.DIAGNOSTIC_BANK_PUBLISHER_PROFILE_ID??""});
  console.log(JSON.stringify(result));
 }
}
