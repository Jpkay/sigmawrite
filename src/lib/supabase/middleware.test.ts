import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const f=vi.hoisted(()=>({user:{id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'} as {id:string}|null,role:'student',mustChange:false}));
vi.mock('@supabase/ssr',()=>({createServerClient:()=>({auth:{getUser:async()=>({data:{user:f.user}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{role:f.role,must_change_password:f.mustChange}})})})})})}));
beforeEach(()=>{vi.resetModules();vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test');f.user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'};f.role='student';f.mustChange=false;});
async function request(path:string){const {updateSession}=await import('./middleware');return updateSession(new NextRequest('https://plume.test'+path,{headers:{'X-Plume-Offline-Owner':'forged-owner'}}));}
it('stamps only the server-validated student owner',async()=>{
 expect((await request('/student/read/example')).headers.get('X-Plume-Offline-Owner')).toBe(f.user!.id);
 expect((await request('/about')).headers.has('X-Plume-Offline-Owner')).toBe(false);
});
it('never stamps unauthenticated, wrong-role or password-change redirects',async()=>{
 f.user=null;expect((await request('/student')).headers.has('X-Plume-Offline-Owner')).toBe(false);
 f.user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'};f.role='teacher';expect((await request('/student')).headers.has('X-Plume-Offline-Owner')).toBe(false);
 f.role='student';f.mustChange=true;expect((await request('/student')).headers.has('X-Plume-Offline-Owner')).toBe(false);
});
it.each([
 ['/admin/users'],
 ['/admin/users/new'],
 ['/admin/schools'],
 ['/admin/schools/example'],
])('allows school administrators into their bounded admin route families: %s',async(path)=>{
 f.role='school_admin';
 expect((await request(path)).headers.get('location')).toBeNull();
});
it.each([
 ['/admin'],
 ['/admin/reports'],
 ['/admin/users-evil'],
 ['/admin/schools-evil'],
])('redirects school administrators away from other or lookalike admin routes: %s',async(path)=>{
 f.role='school_admin';
 expect((await request(path)).headers.get('location')).toBe('https://plume.test/teacher');
});
it.each(['teacher','student'])('blocks %s from school administration routes',async(role)=>{
 f.role=role;
 expect((await request('/admin/schools')).headers.get('location')).toBe(`https://plume.test/${role}`);
});
it('preserves mandatory password setup before school administration access',async()=>{
 f.role='school_admin';f.mustChange=true;
 expect((await request('/admin/schools')).headers.get('location')).toBe('https://plume.test/set-password?first=1');
});
