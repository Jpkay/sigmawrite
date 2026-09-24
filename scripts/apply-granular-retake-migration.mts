/** Apply only the diagnostic-retake migration to the linked pilot database. */
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {config} from "dotenv";

config({path:".env.local",quiet:true});
const mode=process.argv[2];
if(!["--check","--apply"].includes(mode)||process.argv.length!==3)throw Error("Use --check or --apply.");

const project="pwztnrirtrnicywvdbpz";
if(readFileSync("supabase/.temp/project-ref","utf8").trim()!==project
 ||new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??"https://invalid.invalid").hostname!==`${project}.supabase.co`){
 throw Error("Linked database and local service environment differ.");
}

const version="20260924100000",name="granular_diagnostic_retakes";
const source=readFileSync(`supabase/migrations/${version}_${name}.sql`,"utf8");
if(!/^begin;\s*$/m.test(source)||!/^commit;\s*$/m.test(source))throw Error("Migration transaction boundary missing.");
const body=source.replace(/^begin;\s*$/m,"").replace(/^commit;\s*$/m,"");
if(/\b(?:begin|commit|rollback)\s*;/i.test(body))throw Error("Unexpected migration transaction boundary.");
const literal=(value:string)=>`'${value.replaceAll("'","''")}'`;
const sql=`begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
select pg_advisory_xact_lock(hashtext('plume-reviewed-release-migrations'));
do $guard$ begin
 if exists(select 1 from supabase_migrations.schema_migrations where version=${literal(version)}) then
  raise exception 'migration_already_recorded';
 end if;
 if not exists(select 1 from pg_constraint where conname='granular_assessment_sessions_student_id_release_id_key'
  and conrelid='public.granular_assessment_sessions'::regclass) then
  raise exception 'diagnostic_session_schema_drift';
 end if;
end $guard$;
${body}
${mode==="--apply"?`insert into supabase_migrations.schema_migrations(version,name,statements)
values(${literal(version)},${literal(name)},array[${literal(source)}]);`:""}
${mode==="--apply"?"commit":"rollback"};`;
const result=spawnSync("supabase",["db","query","--linked",sql,"--output","json"],{
 encoding:"utf8",timeout:60_000,maxBuffer:1_000_000,
});
if(result.error||result.status!==0)throw Error("Migration outcome not confirmed. Inspect the migration ledger and schema before retrying.");
process.stdout.write(JSON.stringify({project,version,mode,applied:mode==="--apply"})+"\n");
