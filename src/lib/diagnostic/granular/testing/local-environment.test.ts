import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,lstat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {expect,it} from "vitest";
import {copyLocalTestWorkspace,localStackEnvironment,writeLocalStackConfig} from "./local-environment";
const local={API_URL:"http://127.0.0.1:56321",DB_URL:"postgresql://postgres:test@127.0.0.1:56322/postgres",ANON_KEY:"local-anon-fixture",SERVICE_ROLE_KEY:"local-service-fixture"};
it("rejects hosted endpoints, another local project and endpoint decorations",()=>{
 for(const override of [{API_URL:"https://example.supabase.co"},{API_URL:"http://127.0.0.1:55321"},{API_URL:"http://secret@127.0.0.1:56321"},{API_URL:"http://127.0.0.1:56321/?target=remote"},{DB_URL:"postgresql://postgres:secret@remote.invalid:56322/postgres"},{DB_URL:"postgresql://postgres:secret@127.0.0.1:55322/postgres"}])expect(()=>localStackEnvironment({...local,...override})).toThrow();
});
it("does not inherit hosted secrets, Docker overrides or Node injection options",()=>{
 const env=localStackEnvironment(local,{PATH:"/bin",HOME:"/test-home",SUPABASE_SERVICE_ROLE_KEY:"hosted-secret",OPENAI_API_KEY:"hosted-ai",SENTRY_DSN:"hosted-monitor",DOCKER_HOST:"tcp://remote.invalid",NODE_OPTIONS:"--require injected"});
 expect(env).toMatchObject({PATH:"/bin",SUPABASE_SERVICE_ROLE_KEY:"local-service-fixture",PORT:"56300"});
 for(const name of ["OPENAI_API_KEY","SENTRY_DSN","DOCKER_HOST","NODE_OPTIONS"])expect(env).not.toHaveProperty(name);
 expect(JSON.stringify(env)).not.toContain("hosted");
});
it("copies current source without dotenv files, linked project state or external symlinks",async()=>{
 const root=await mkdtemp(join(tmpdir(),"granular-isolation-test-")),source=join(root,"source"),target=join(root,"target");
 try{
  await mkdir(join(source,"src"),{recursive:true});await mkdir(join(source,"node_modules"));await mkdir(join(source,"supabase/.temp"),{recursive:true});
  await writeFile(join(source,"src/example.ts"),"export const current = true;");await writeFile(join(source,".env.local"),"PRODUCTION_SECRET=fixture");await writeFile(join(source,"src/.env.test.local"),"OTHER_SECRET=fixture");await writeFile(join(source,"supabase/.temp/project-ref"),"hosted-project");
  await symlink(join(source,".env.local"),join(source,"src/linked-secret"));
  for(const name of ["instrumentation.ts","instrumentation-client.ts"])await writeFile(join(source,name),"export const parity = true;");
  await copyLocalTestWorkspace(source,target);await writeLocalStackConfig(target,"plume-granular-e2e-ab12cd34");
  expect(await readFile(join(target,"src/example.ts"),"utf8")).toContain("current");
  for(const name of ["instrumentation.ts","instrumentation-client.ts"])expect(await readFile(join(target,name),"utf8")).toContain("parity");
  for(const path of [".env.local","src/.env.test.local","src/linked-secret","supabase/.temp/project-ref"])await expect(lstat(join(target,path))).rejects.toMatchObject({code:"ENOENT"});
  expect(await readFile(join(target,"supabase/config.toml"),"utf8")).toContain("port = 56321");expect((await lstat(join(target,"node_modules"))).isSymbolicLink()).toBe(true);
 }finally{await rm(root,{recursive:true,force:true});}
});
