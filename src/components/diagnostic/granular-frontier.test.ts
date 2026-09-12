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
 for(const text of ['À confirmer','Pas encore vérifié','Reconnaître','Écrire la réponse','Questions à venir','Les bases liées à ce point','Reprendre le diagnostic'])expect(html).toContain(text);
 expect(html).not.toContain('50%');expect(html).not.toContain('Bien acquis</span>');
 expect(html).toContain('href="/student/diagnostic"');
});
it('links learning students to the exact planned activity without offering to restart their diagnostic',()=>{
 const html=renderToStaticMarkup(React.createElement(GranularFrontier,{data:{...data,phase:'learning',activities:[{skillId:'production',activityId:'next-check',kind:'independent_check',action:'verify',titleFr:'Vérifier le présent',href:'/student/diagnostic?activity=next-check',estimatedMinutes:3}]}}));
 expect(html).toContain('href="/student/diagnostic?activity=next-check"');expect(html).toContain('Vérifier le présent');expect(html).not.toContain('Reprendre le diagnostic');
});
