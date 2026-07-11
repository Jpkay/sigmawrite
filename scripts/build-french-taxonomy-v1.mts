import{readFileSync,writeFileSync}from"node:fs";import{resolve}from"node:path";import{buildFrenchTaxonomyV1}from"../src/lib/taxonomy/french-v1";import type{BaselineLexiconArtifact}from"../src/lib/lexicon/baseline";
const output=resolve("generated/french-taxonomy-v1.json");
const artifact=buildFrenchTaxonomyV1({ontologyText:readFileSync("docs/french-ontology-v1.md","utf8"),sourceRegisterText:readFileSync("docs/french-source-register.md","utf8"),lexical:JSON.parse(readFileSync("generated/french-baseline-lexicon.json","utf8")) as BaselineLexiconArtifact});
const serialized=`${JSON.stringify(artifact,null,2)}\n`;
if(process.argv.includes("--check")){const current=readFileSync(output,"utf8");if(current!==serialized)throw new Error("generated/french-taxonomy-v1.json is stale; run npm run taxonomy:build:v1");}
else writeFileSync(output,serialized,"utf8");
process.stdout.write(`${JSON.stringify({output,checksum:artifact.manifest.contentChecksum,coverage:artifact.coverage,warnings:artifact.validation.issues.length})}\n`);

