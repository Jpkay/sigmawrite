/** Resumable insert-only import into an existing draft granular bank.
 * No publication or approval is granted. Stop other import writers first.
 * Default writes private SQL files only; --apply executes and verifies all rows. */
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {stableUuid} from '../src/lib/lexicon/baseline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from '../src/lib/diagnostic/item-bank';
import {verifyRelationalBank} from '../src/lib/diagnostic/granular/relational-bank';
import {isFrenchGranularBankKey} from '../src/lib/diagnostic/granular/bank-family';
config({path:process.env.DIAGNOSTIC_ENV_FILE??'.env.local',quiet:true});
const path=process.argv[2];if(!path)throw Error('Expected canonical bank path [--apply]');
const bank=JSON.parse(readFileSync(path,'utf8')) as CanonicalDiagnosticBankArtifact;
const artifact=JSON.parse(readFileSync('generated/french-taxonomy-v3.json','utf8'));
const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);
if(validation.issues.length||!isFrenchGranularBankKey(bank.bank.key)||bank.items.some(e=>e.reviewStatus==='rejected'||e.qcGates.verdict==='rejected'))throw Error('Unsupported or invalid granular bank');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const release=await db.from('diagnostic_item_bank_releases').select('id,status,manifest_checksum,taxonomy_release_id').eq('bank_key',bank.bank.key).single();if(release.error)throw release.error;
if(release.data.status!=='draft'||release.data.manifest_checksum!==validation.manifest.checksum)throw Error('Expected matching draft bank');
const taxonomy=await db.from('taxonomy_releases').select('status,manifest_checksum').eq('id',release.data.taxonomy_release_id).single();if(taxonomy.error)throw taxonomy.error;
if(taxonomy.data.status!=='published'||taxonomy.data.manifest_checksum!==bank.taxonomy.checksum||bank.taxonomy.checksum!==artifact.manifest.contentChecksum)throw Error('Wrong approved taxonomy');
const pin=await db.from('taxonomy_release_memberships').select('record_type,record_id,stable_key').eq('release_id',release.data.taxonomy_release_id).in('record_type',['competency_node','mastery_evidence']);if(pin.error)throw pin.error;
const nodes=new Map(pin.data.filter(r=>r.record_type==='competency_node').map(r=>[r.stable_key,r.record_id])),evidence=new Map(pin.data.filter(r=>r.record_type==='mastery_evidence').map(r=>[r.stable_key,r.record_id]));
const reviewers=[...new Set(bank.items.flatMap(e=>e.review?.reviewerProfileId?[e.review.reviewerProfileId]:[]))];
for(let i=0;i<reviewers.length;i+=100){const ids=reviewers.slice(i,i+100),found=await db.from('profiles').select('id').in('id',ids);if(found.error||found.data?.length!==ids.length)throw Error('Reviewer provenance unavailable; no approvals may be invented');}
const rows=bank.items.map(entry=>{
 const node=nodes.get(entry.item.nodeKey),ev=evidence.get(`${entry.item.nodeKey}:${entry.evidenceKey}`);if(!node||!ev)throw Error('Missing pinned graph record');
 const id=stableUuid('sigmawrite-diagnostic-item',`${bank.bank.key}:${entry.itemKey}`),q=entry.item;
 return {item:{id,primary_node_id:node,strand:q.strand,modality:q.modality,learner_mode:q.learnerMode,response_type:q.responseType,prompt_fr:q.promptFr,instructions_fr:q.instructionsFr??null,correct_answer:q.correctAnswer??null,acceptable_answers:q.acceptableAnswers??[],validator_type:q.validatorType,validator_config:q.validatorConfig??null,difficulty:q.difficulty??50,cefr_level:q.cefrLevel??null,generation_type:entry.reviewStatus==='human_approved'?'ai_human_reviewed':'ai',generation_model:'canonical-import',prompt_version:bank.bank.key,qc_gates:entry.qcGates,review_status:entry.reviewStatus,reviewer_profile_id:entry.review?.reviewerProfileId??null,reviewed_at:entry.review?.reviewedAt??null},choices:(q.choices??[]).map((c,position)=>({item_id:id,choice_text:c.text,is_correct:c.correct,position,feedback_fr:c.feedbackFr??null})),membership:{bank_release_id:release.data.id,item_id:id,node_id:node,mastery_evidence_id:ev,section_key:entry.sectionKey,evidence_expectation:entry.evidenceExpectation,modality:q.modality,prompt_family:entry.promptFamily,difficulty_tier:entry.difficultyTier,difficulty:q.difficulty??50}};
});
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const directory=mkdtempSync(join(tmpdir(),'plume-granular-batches-'));
for(let i=0;i<rows.length;i+=100){
 const batch=rows.slice(i,i+100),itemColumns=Object.keys(batch[0].item),memberColumns=Object.keys(batch[0].membership),choiceColumns=['item_id','choice_text','is_correct','position','feedback_fr'];
 const sql=`begin;
do $$ begin
 perform 1 from public.diagnostic_item_bank_releases where id=${quote(release.data.id)}::uuid and status='draft' and manifest_checksum=${quote(validation.manifest.checksum)} for update;
 if not found then raise exception 'Draft bank changed'; end if;
end $$;
create temporary table batch_payload(data jsonb) on commit drop;
insert into batch_payload values (${quote(JSON.stringify(batch))}::jsonb);
insert into public.competency_items (${itemColumns.join(',')})
select ${itemColumns.map(c=>'r.'+c).join(',')} from batch_payload b cross join lateral jsonb_array_elements(b.data) e cross join lateral jsonb_populate_record(null::public.competency_items,e.value->'item') r
on conflict(id) do nothing;
insert into public.competency_item_choices (${choiceColumns.join(',')})
select ${choiceColumns.map(c=>'r.'+c).join(',')} from batch_payload b cross join lateral jsonb_array_elements(b.data) e cross join lateral jsonb_array_elements(e.value->'choices') c cross join lateral jsonb_populate_record(null::public.competency_item_choices,c.value) r
where not exists(select 1 from public.competency_item_choices old where old.item_id=r.item_id and old.position=r.position);
insert into public.diagnostic_item_bank_memberships (${memberColumns.join(',')})
select ${memberColumns.map(c=>'r.'+c).join(',')} from batch_payload b cross join lateral jsonb_array_elements(b.data) e cross join lateral jsonb_populate_record(null::public.diagnostic_item_bank_memberships,e.value->'membership') r
on conflict(bank_release_id,item_id) do nothing;
commit;
`;
 const file=join(directory,`${String(i).padStart(5,'0')}.sql`);writeFileSync(file,sql,{mode:0o600});
 if(process.argv.includes('--apply')){
  execFileSync('supabase',['db','query','--linked','--file',file,'--output','json'],{stdio:['ignore','pipe','pipe'],maxBuffer:1_000_000});
  console.log(JSON.stringify({processed:Math.min(i+100,rows.length),total:rows.length}));
 }
}
if(process.argv.includes('--apply')){
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const verified=await verifyRelationalBank(db,{bank,assessment:candidate.assessment,taxonomyId:release.data.taxonomy_release_id,bankId:release.data.id});
 console.log(JSON.stringify({status:'draft_import_verified',...verified,bankReleaseId:release.data.id,checksum:validation.manifest.checksum}));
}else console.log(JSON.stringify({status:'sql_prepared_not_applied',directory,batches:Math.ceil(rows.length/100),bankReleaseId:release.data.id}));
