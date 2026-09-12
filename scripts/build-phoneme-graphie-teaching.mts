import {readFileSync,writeFileSync} from 'node:fs';
import {buildPhonemeGraphieTeaching} from '../src/lib/diagnostic/granular/phoneme-graphie-teaching';
import {teachingMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
const manifest=JSON.parse(readFileSync('generated/french-phoneme-graphie-audio-draft.json','utf8'));
const lessons=buildPhonemeGraphieTeaching(manifest.assets);
for(const lesson of lessons)teachingMaterialKeys(lesson);
const output=JSON.stringify({status:'draft_requires_review',lessons},null,2)+'\n',path='generated/french-phoneme-graphie-teaching-draft.json';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale audio teaching draft');}else writeFileSync(path,output);
console.log(JSON.stringify({lessons:lessons.length,status:'draft_requires_review'}));
