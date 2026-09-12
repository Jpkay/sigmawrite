import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {DiagnosticAnswerReviewPanel} from './answer-review';
import {answerReviewDisplayText} from '@/lib/diagnostic/granular/answer-review-copy';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
it('records the wording rendered for a wrong answer and missing historical details',()=>{
 const rows=[{itemId:'one',number:1,promptFr:'Un court texte.',instructionsFr:null,status:'wrong' as const,submittedAnswer:null,expectedAnswer:null,submittedSupport:null,expectedSupport:'Le passage attendu.'}];
 const html=renderToStaticMarkup(React.createElement(DiagnosticAnswerReviewPanel,{review:{sessionId:'session',rows}}));
 const recorded=deliveredTextFragments({rows,displayText:answerReviewDisplayText(rows)});
 for(const text of ['Question 1 · Réponse à revoir','Voir seulement mes erreurs','Le détail de cette ancienne réponse n’a pas été conservé.','Aucune réponse modèle disponible.','Passage choisi non conservé.']){expect(html).toContain(text);expect(recorded).toContain(text);}
 expect(html).not.toContain('Réponse correcte');
});
