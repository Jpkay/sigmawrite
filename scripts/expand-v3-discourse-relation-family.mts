import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {buildDiscourseRelationExpansion} from "../src/lib/diagnostic/granular/discourse-relation-expansion";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const outputPath=resolve(process.argv.find(argument=>argument.startsWith("--output="))?.slice("--output=".length)??"tmp/coverage-discourse-relation-family.json");
if(!outputPath.startsWith(`${resolve("tmp")}/coverage-`))throw Error("Coverage drafts may only be written under tmp/coverage-*");
const artifact=await buildDiscourseRelationExpansion(read("generated/french-taxonomy-v3.json"),read("generated/diagnostic-bank-v3-draft.json"));
const output=`${JSON.stringify(artifact,null,2)}\n`;
if(process.argv.includes("--check")){if(readFileSync(outputPath,"utf8")!==output)throw Error("Stale discourse-relation coverage draft");}
else{mkdirSync(dirname(outputPath),{recursive:true});writeFileSync(outputPath,output);}
console.log(JSON.stringify({output:outputPath,questions:artifact.items.length,initial:artifact.poolIntents.initial.length,learning:artifact.poolIntents.learning.length,status:artifact.status}));
