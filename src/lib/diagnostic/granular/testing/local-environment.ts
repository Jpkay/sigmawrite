import {cp,mkdir,lstat,symlink,writeFile} from "node:fs/promises";
import {join,basename} from "node:path";
export const LOCAL_PORTS={app:56300,api:56321,db:56322,shadow:56320,studio:56323,inbucket:56324,analytics:56327,pooler:56329} as const;
/** A dedicated source copy prevents Next or seeding scripts from loading the
 * working project's hosted credentials through implicit dotenv conventions. */
export function includeLocalTestPath(path:string){
 const name=basename(path);
 return !name.startsWith(".env")&&!new Set([".git",".vercel",".temp",".branches","node_modules",".next",".claude",".codex"]).has(name)
  &&!/[.](pem|key|p12|pfx)$/i.test(name);
}
export async function copyLocalTestWorkspace(source:string,destination:string){
 await mkdir(destination,{recursive:true});
 for(const name of ["src","public","generated","taxonomy","supabase","scripts","e2e","docs","package.json","package-lock.json","tsconfig.json","next.config.ts","next-env.d.ts","instrumentation.ts","instrumentation-client.ts","postcss.config.mjs","eslint.config.mjs","vitest.config.ts","playwright.config.ts"]){
  const from=join(source,name);try{await lstat(from);}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")continue;throw error;}
  await cp(from,join(destination,name),{recursive:true,filter:async path=>includeLocalTestPath(path)&&!(await lstat(path)).isSymbolicLink()});
 }
 await symlink(join(source,"node_modules"),join(destination,"node_modules"),"dir");
}
export async function writeLocalStackConfig(directory:string,projectId:string){
 if(!/^plume-granular-e2e-[a-f0-9]{8}$/.test(projectId))throw Error("Invalid isolated project identity");
 await mkdir(join(directory,"supabase"),{recursive:true});
 await writeFile(join(directory,"supabase/config.toml"),`project_id = "${projectId}"
[api]
enabled = true
port = ${LOCAL_PORTS.api}
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
[db]
port = ${LOCAL_PORTS.db}
shadow_port = ${LOCAL_PORTS.shadow}
major_version = 17
[db.seed]
enabled = false
[auth]
enabled = true
site_url = "http://127.0.0.1:${LOCAL_PORTS.app}"
additional_redirect_urls = ["http://localhost:${LOCAL_PORTS.app}"]
enable_signup = true
minimum_password_length = 12
[auth.email]
enable_signup = true
enable_confirmations = false
[realtime]
enabled = false
[storage]
enabled = false
[studio]
enabled = false
[inbucket]
enabled = false
[analytics]
enabled = false
[edge_runtime]
enabled = false
`);
}
export function localStackEnvironment(status:Record<string,unknown>,host:Partial<NodeJS.ProcessEnv>=process.env){
 const api=new URL(String(status.API_URL)),db=new URL(String(status.DB_URL));
 if(api.href!==`http://127.0.0.1:${LOCAL_PORTS.api}/`||!['postgres:','postgresql:'].includes(db.protocol)||db.hostname!=="127.0.0.1"||db.port!==String(LOCAL_PORTS.db)||db.pathname!=="/postgres"||db.search||db.hash)
  throw Error("Refusing a non-isolated Supabase endpoint");
 if(typeof status.ANON_KEY!=="string"||!status.ANON_KEY||typeof status.SERVICE_ROLE_KEY!=="string"||!status.SERVICE_ROLE_KEY)throw Error("Missing local Supabase credentials");
 const environment:NodeJS.ProcessEnv={NODE_ENV:"development"};
 for(const key of ["PATH","HOME","TMPDIR","SystemRoot"])if(host[key])environment[key]=host[key];
 return {...environment,NODE_ENV:"development",NEXT_TELEMETRY_DISABLED:"1",NEXT_PUBLIC_SUPABASE_URL:api.origin,NEXT_PUBLIC_SUPABASE_ANON_KEY:status.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:status.SERVICE_ROLE_KEY,GRANULAR_DIAGNOSTIC_ENABLED:"true",PORT:String(LOCAL_PORTS.app),E2E_AUTHENTICATED:"true"};
}
