import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const repoRoot=process.cwd();
const sourcesPath=resolve(repoRoot,"src/lib/diagnostic/granular/draft-expansion-sources.ts");
if(!existsSync(sourcesPath))throw Error(`Run test artifact preparation from the repository root: missing ${sourcesPath}`);

const {FRENCH_DRAFT_EXPANSION_SOURCES}=await import(pathToFileURL(sourcesPath).href) as {
 FRENCH_DRAFT_EXPANSION_SOURCES:readonly string[];
};

const generated:string[]=[];
for(const source of FRENCH_DRAFT_EXPANSION_SOURCES){
 const output=resolve(repoRoot,`generated/french-v3-${source}-expansion.json`);
 if(existsSync(output))continue;

 const generator=resolve(repoRoot,`scripts/expand-v3-${source}.mts`);
 if(!existsSync(generator))throw Error(`Missing generator for required test artifact: ${generator}`);

 console.log(`Preparing missing test artifact: ${output}`);
 await import(pathToFileURL(generator).href);
 if(!existsSync(output))throw Error(`Generator did not create required test artifact: ${output}`);
 generated.push(output);
}

console.log(JSON.stringify({preparedTestArtifacts:generated.length}));
