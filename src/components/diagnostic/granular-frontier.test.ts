import {frontierDisplayText} from '@/lib/diagnostic/granular/frontier-copy';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {GranularFrontier} from './granular-frontier';
import type {GranularFrontierView} from '@/lib/diagnostic/granular/frontier-view';
const data:GranularFrontierView={sessionId:'session',releaseId:'release',phase:'assessing',coverage:null,activities:[],nodes:[
 {id:'recognition',labelFr:'Employer le présent',domain:'conjugation',prerequisites:[],assessmentAvailable:true,result:{skillId:'recognition',status:'uncertain',evidence:'direct',resolved:false,modes:[{mode:'recognition',probability:.5,distinctItems:1,distinctContexts:1,distinctOccasions:1,accuracy:1,confirmed:false}]}},
 {id:'production',labelFr:'Employer le présent',domain:'conjugation',prerequisites:['recognition'],assessmentAvailable:false,result:{skillId:'production',status:'unknown',evidence:'untested',resolved:false,modes:[{mode:'production',probability:.5,distinctItems:0,distinctContexts:0,distinctOccasions:0,accuracy:0,confirmed:false}]}},
]};
it('shows uncertainty, separate modes and prerequisite status without inventing a mastery percentage',()=>{
 const html=renderToStaticMarkup(React.createElement(GranularFrontier,{data}));
 for(const text of ['Encore à vérifier','Pas encore vérifié','Reconnaître','Écrire la réponse','Questions à venir','Les bases liées à ce point','Reprendre le diagnostic'])expect(html).toContain(text);
 expect(html).toContain('Ouvre un point pour voir les réponses utilisées. Si un point n’a pas encore été vérifié, cela ne veut pas dire que tu as des difficultés.');
 expect(html).not.toContain('50%');expect(html).not.toContain('Bien acquis</span>');
 expect(html).toContain('href="/student/diagnostic"');
});
it('links learning students to the exact planned activity without offering to restart their diagnostic',()=>{
 const html=renderToStaticMarkup(React.createElement(GranularFrontier,{data:{...data,phase:'learning',activities:[{skillId:'production',activityId:'next-check',kind:'independent_check',action:'verify',titleFr:'Vérifier le présent',href:'/student/diagnostic?activity=next-check',estimatedMinutes:3}]}}));
 expect(html).toContain('href="/student/diagnostic?activity=next-check"');expect(html).toContain('Question : repérer le présent');expect(html).toContain('Ce que nous te proposons de travailler ensuite');expect(html).not.toContain('Reprendre le diagnostic');
});

it('records all possible filter counts and the exact expanded detail wording without changing the map',()=>{
 const before=JSON.stringify(data),display=frontierDisplayText(data),text=deliveredTextFragments(display);
 expect(display.counts).toEqual(['0 points affichés','1 point affiché','2 points affichés']);
 const html=renderToStaticMarkup(React.createElement(GranularFrontier,{data}));
 for(const line of ['1 réponse prise en compte.','Écrire la réponse · Pas encore vérifié · Questions à venir','Utiliser le présent · Reconnaître · Encore à vérifier']){expect(html).toContain(line);expect(text).toContain(line);}
 for(const line of ['Ce qu’il faut encore vérifier','Utiliser le présent','D’autres points n’ont pas encore été vérifiés. Cela ne veut pas dire que tu ne sais pas les faire.','Voir le détail de tous les points'])expect(html).toContain(line);
 expect(html).not.toContain('Ce que tu sais déjà faire</dt>');expect(html).not.toContain('544 points');
 expect(JSON.stringify(data)).toBe(before);
});
