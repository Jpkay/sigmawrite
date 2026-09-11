import {mkdtemp,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {randomUUID} from "node:crypto";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {copyLocalTestWorkspace,writeLocalStackConfig,localStackEnvironment,LOCAL_PORTS} from "../../src/lib/diagnostic/granular/testing/local-environment";
const execute=promisify(execFile),source=resolve(import.meta.dirname,"../.."),directory=await mkdtemp(join(tmpdir(),"plume-granular-e2e-"));
const projectId=`plume-granular-e2e-${randomUUID().slice(0,8)}`;
const hostEnvironment:NodeJS.ProcessEnv={NODE_ENV:"development"};
for(const key of ["PATH","HOME","TMPDIR","SystemRoot"])if(process.env[key])hostEnvironment[key]=process.env[key];
const manifest={version:1,projectId,directory,source,ports:LOCAL_PORTS,preparedAt:new Date().toISOString(),status:"preparing",fixturesSeeded:false,authenticatedJourneyTested:false};
const persist=()=>writeFile(join(directory,"granular-local-stack.json"),JSON.stringify(manifest,null,2)+"\n");
try{
 await copyLocalTestWorkspace(source,directory);await writeLocalStackConfig(directory,projectId);
 manifest.status="prepared";await persist();
 console.log(`Prepared isolated source and Supabase configuration: ${directory}`);
 if(process.argv.includes("--start")){
  let endpoint:string;
  try{endpoint=(await execute("docker",["context","inspect","--format","{{.Endpoints.docker.Host}}"],{env:hostEnvironment,timeout:5000})).stdout.trim();}
  catch{throw Error("Cannot inspect the configured Docker endpoint; no stack was started.");}
  if(!endpoint.startsWith("unix://"))throw Error("Refusing to start fixtures against a remote Docker endpoint.");
  try{await execute("docker",["info","--format","{{.ServerVersion}}"],{env:hostEnvironment,timeout:5000});}
  catch{manifest.status="docker_unavailable";throw Error("Local Docker is not responding. The isolated workspace is preserved; no application or fixture seed was started.");}
  manifest.status="starting";await persist();
  // CLI output may contain local credentials. Capture it, never print it.
  try{await execute("supabase",["start","--workdir",directory],{env:hostEnvironment,timeout:600000,maxBuffer:20*1024*1024});}
  catch{manifest.status="start_failed";throw Error("The isolated Supabase stack did not become ready. Inspect this project's containers before retrying; other projects were not stopped.");}
  const status=JSON.parse((await execute("supabase",["status","--workdir",directory,"--output","json"],{env:hostEnvironment,timeout:10000})).stdout);
  const environment=localStackEnvironment(status,hostEnvironment);
  const variables=Object.entries(environment).filter(([name])=>!(name in hostEnvironment));
  await writeFile(join(directory,".env.local"),variables.map(([name,value])=>`${name}=${JSON.stringify(value)}`).join("\n")+"\n",{mode:0o600});
  manifest.status="stack_ready";
  console.log("Isolated Supabase is ready. Application fixtures and the authenticated journey still need to run.");
 }
 await persist();
}catch(error){await persist();console.error(error instanceof Error?error.message:"Local setup failed.");process.exitCode=1;}
