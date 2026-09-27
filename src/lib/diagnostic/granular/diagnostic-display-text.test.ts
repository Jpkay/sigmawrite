import {expect,it} from 'vitest';
import type {AssessmentView} from './client-state';
import {diagnosticDisplayText} from './diagnostic-display-text';
import {diagnosticProgressPercent} from '@/components/diagnostic/diagnostic-copy';
it('captures generated lesson, writing and feature wording without treating it as mastery evidence',()=>{
 const view={answeredCount:3,skippedCount:1,remainingSeconds:61,
  teaching:{exerciseIndex:2,totalExercises:6},
  writingFeedback:{assessed:true,checkedCount:3,correctCount:2},
  results:[{modes:[{distinctItems:4,featureEvidence:[{correctItems:1,distinctItems:4},{correctItems:0,distinctItems:0}]}]}]
 } as unknown as AssessmentView;
 const before=JSON.stringify(view);
 expect(diagnosticDisplayText(view)).toEqual([
  '3 réponses enregistrées · 1 question passée · environ 2 min restantes','Question 5',
  'Entraînement 3 sur 6 · Tu peux demander de l’aide.',
  '1 passage à revoir parmi 3 vérifiés.','4 réponse(s)','1 réponse réussie sur 4',
 ]);
 expect(JSON.stringify(view)).toBe(before);
});
it('handles the initial state without inventing feedback for an unassessed text',()=>{
 const view={answeredCount:0,skippedCount:0,remainingSeconds:2100,results:[],writingFeedback:{assessed:false,checkedCount:0,correctCount:0}} as unknown as AssessmentView;
 expect(diagnosticDisplayText(view)).toEqual(['0 réponses enregistrées · environ 35 min restantes','Question 1']);
 expect(diagnosticProgressPercent(2100)).toBe(0);expect(diagnosticProgressPercent(1050)).toBe(50);expect(diagnosticProgressPercent(0)).toBe(100);
});
