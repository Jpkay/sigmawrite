/** Explicit reviewed onboarding migrations; never pushes unrelated pending migrations. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {config} from 'dotenv';

config({path: '.env.local', quiet: true});
const mode = process.argv[2];
if (!['--check', '--apply'].includes(mode)) throw Error('Use --check, or --apply after integration tests and preflight.');
const project = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (project !== 'pwztnrirtrnicywvdbpz' || new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname !== `${project}.supabase.co`) {
  throw Error('Not the reviewed Plume public pilot database.');
}
const names = ['20260914100000_school_self_service', '20260914101000_teacher_assignment_boundaries', '20260914102000_school_invitations'];
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const migrations = names.map(name => ({name, version: name.split('_')[0], sql: readFileSync(`supabase/migrations/${name}.sql`, 'utf8')}));
const checks = `
  if exists(select 1 from class_join_codes where revoked_at is null group by class_id having count(*) > 1) then
    raise exception 'Duplicate live invitation codes require owner review';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where version in ('0100','0126','20260913110000','20260913111000')) <> 4 then
    raise exception 'Missing reviewed historical prerequisite';
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where version in (${migrations.map(m => literal(m.version)).join(',')})) then
    raise exception 'Migration already recorded: inspect exact state before any retry';
  end if;
  if exists(select 1 from teacher_classes tc join profiles p on p.id=tc.teacher_profile_id join classes c on c.id=tc.class_id
    where p.role='teacher' and p.deactivated_at is null and p.school_id is not null and p.school_id is distinct from c.school_id)
    or exists(select 1 from teacher_students ts join profiles p on p.id=ts.teacher_profile_id join students s on s.id=ts.student_id
      where p.role='teacher' and p.deactivated_at is null and (p.school_id is null or s.school_id is null or p.school_id is distinct from s.school_id))
    or exists(select 1 from teacher_classes tc join enrollments e on e.class_id=tc.class_id join classes c on c.id=tc.class_id join students s on s.id=e.student_id
      where e.status='active' and s.school_id is not null and s.school_id is distinct from c.school_id) then
    raise exception 'Existing ambiguous or cross-school assignments require owner review';
  end if;
`;
const sql = `begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtext('plume-reviewed-release-migrations'));
do $guard$ begin ${checks} end $guard$;
${mode === '--apply' ? migrations.map(m => `${m.sql}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values(${literal(m.version)},${literal(m.name.slice(m.version.length + 1))},array[${literal(m.sql)}]);`).join('\n') : ''}
${mode === '--apply' ? 'commit' : 'rollback'};
select jsonb_build_object('project',${literal(project)},'mode',${literal(mode)},'versions',jsonb_build_array(${migrations.map(m => literal(m.version)).join(',')}),'checked',true) result;`;
try {
  const result = execFileSync('supabase', ['db', 'query', '--linked', sql, '--output', 'json'], {encoding: 'utf8', maxBuffer: 1000000});
  console.log(result);
} catch {
  throw Error('Outcome not confirmed. Inspect exact schema and ledger; never blindly repeat --apply.');
}
