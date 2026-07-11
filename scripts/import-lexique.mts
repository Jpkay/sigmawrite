import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { vocabularyDifficultyFromFrequency } from "@/lib/content/vocabulary-frequency";

loadEnv({ path: ".env.local", quiet: true });
if (process.env.ALLOW_UNLICENSED_LEXIQUE_IMPORT !== "development-only-not-for-production") {
  throw new Error("Lexique is not approved for SigmaWrite production import. Use npm run lexicon:import with the licensed baseline artifact.");
}
const path=process.argv[2]; if(!path) throw new Error("Usage: npx tsx scripts/import-lexique.mts <Lexique.tsv>");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url||!key)throw new Error("Supabase service environment is required");
const db=createClient(url,key,{auth:{persistSession:false}}); const lines=readFileSync(path,"utf8").split(/\r?\n/).filter(Boolean); const headers=lines[0].split("\t"); const wordIndex=headers.findIndex(h=>["ortho","lemme","lemma"].includes(h.toLowerCase())); const frequencyIndex=headers.findIndex(h=>["freqlemfilms2","freqlemlivres","frequency"].includes(h.toLowerCase())); if(wordIndex<0||frequencyIndex<0)throw new Error("Expected Lexique columns ortho/lemme and frequency");
const {data:existing}=await db.from("vocabulary_items").select("id,lemma"); const byLemma=new Map((existing??[]).map(row=>[String(row.lemma).toLowerCase(),row.id])); let changed=0;
for(const line of lines.slice(1)){const cells=line.split("\t");const word=cells[wordIndex]?.trim();const frequency=Number(cells[frequencyIndex]?.replace(",","."));if(!word||!Number.isFinite(frequency))continue;const values={lemma:word.toLowerCase(),display_word:word,frequency_per_million:frequency,frequency_source:"Lexique3",difficulty:vocabularyDifficultyFromFrequency(frequency),active:true};const id=byLemma.get(word.toLowerCase());const result=id?await db.from("vocabulary_items").update(values).eq("id",id):await db.from("vocabulary_items").insert(values);if(result.error)throw new Error(result.error.message);changed++;}
console.log(JSON.stringify({ok:true,changed,source:"Lexique3"}));
