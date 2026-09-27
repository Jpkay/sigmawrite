import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COMPLETIVE_PRODUCTION_ASSESSMENT,COMPLETIVE_PRODUCTION_TEACHING,completiveSentence} from './completive-production';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
it('handles que and qu’ while retaining the embedded subject and verb',()=>{
 expect(completiveSentence({intro:'Mila pense',content:'Le musée ferme bientôt.'})).toBe('Mila pense que le musée ferme bientôt.');
 expect(completiveSentence({intro:'Lina suppose',content:'Il reste une place.'})).toBe('Lina suppose qu’il reste une place.');
 expect(completiveSentence({intro:'Le médecin indique',content:'Elle peut sortir.'})).toBe('Le médecin indique qu’elle peut sortir.');
 expect(completiveSentence({intro:'Le journal confirme',content:'Un orage approche.'})).toBe('Le journal confirme qu’un orage approche.');
 expect(COMPLETIVE_PRODUCTION_ASSESSMENT).toHaveLength(24);
});
it('binds the lesson to approved controlled production and separates its material from all checks',()=>{
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 validateTeachingTargets(read('docs/diagnostic/v3-parallel-review-candidate.json').assessment,COMPLETIVE_PRODUCTION_TEACHING);
 const lesson=COMPLETIVE_PRODUCTION_TEACHING[0],taught=teachingMaterialKeys(lesson);
 expect(lesson.practice).toHaveLength(6);
 const expansion=read('generated/french-v3-completive-production-expansion.json');
 expect(expansion.items).toHaveLength(24);
 const seen=new Set<string>();
 for(const entry of expansion.items){
  expect(entry.item.nodeKey).toBe('construction_subordonnee_completive');
  expect(entry.evidenceExpectation).toBe('controlled_production');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.validatorConfig.finiteResponseSpace.alternatives).toHaveLength(8);
  for(const key of questionAssessedMaterialKeys(entry.item)){expect(taught).not.toContain(key);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
});
