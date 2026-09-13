/** Create one explicitly named technical QA account; never replace an account or send email. */
import {config} from 'dotenv';
import {existsSync, writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {provisionManagedAccount} from '../src/lib/user-provisioning';
config({path: '.env.local', quiet: true});
const revision = process.argv[2];
if (!/^r[1-9][0-9]*$/.test(revision ?? '')) throw Error('Expected release revision, e.g. r43');
const username = `doves.granular.${revision}.qa`;
const output = `tmp/plume-granular-${revision}-qa.json`;
if (existsSync(output)) throw Error('QA credentials already exist; resume them');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth: {persistSession: false}});
const check = await db.from('profiles').select('id').eq('username', username).maybeSingle();
if (check.error) throw check.error;
if (check.data) throw Error('QA account already exists; never replace its password');
const school = await db.from('schools').select('id').eq('name', 'Doves').single();
if (school.error) throw school.error;
const classroom = await db.from('classes').select('id').eq('school_id', school.data.id).eq('name', 'Classe de démonstration · 8e année').single();
if (classroom.error) throw classroom.error;
const actor = 'b4cd70c7-55bd-45cc-ba21-b47ea038b0f6';
const credentials = await provisionManagedAccount({role: 'student', displayName: `Test technique du diagnostic ${revision}`,
  requestedUsername: username, grade: 8, schoolId: school.data.id, provisionedByProfileId: actor, deliverEmail: false});
// Preserve recovery credentials before any subsequent operation can fail.
writeFileSync(output, JSON.stringify(credentials), {flag: 'wx', mode: 0o600});
for (const result of [
  await db.from('profiles').update({must_change_password: false}).eq('id', credentials.profileId),
  await db.from('enrollments').insert({student_id: credentials.studentId, class_id: classroom.data.id, status: 'active'}),
  await db.from('students').update({school_id: school.data.id}).eq('id', credentials.studentId),
  await db.from('audit_logs').insert({actor_profile_id: actor, action: 'student.granular_verification_account_created', target_type: 'student',
    target_id: credentials.studentId, metadata: {schoolId: school.data.id, classId: classroom.data.id, previewAccount: true}}),
]) if (result.error) throw result.error;
const access = await db.rpc('student_access_is_authorized', {p_student_id: credentials.studentId});
if (access.error || access.data !== true) throw Error('QA student access was not authorized');
console.log(JSON.stringify({username, studentId: credentials.studentId, accessAuthorized: true, emailsSent: 0}));
