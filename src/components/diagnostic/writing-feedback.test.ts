import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {WritingFeedbackCard} from './writing-feedback';
import type {WritingFeedback} from '@/lib/diagnostic/granular/writing-feedback';
const feedback:WritingFeedback={skillLabelFr:'Accorder le verbe',text:'Les chats joue.',checkedCount:1,correctCount:0,passages:[{start:10,end:14,text:'joue',correct:false,explanationFr:'Avec les chats, écris jouent.'}]};
it('shows the actual passage and explanation without calling one text mastery',()=>{
 const html=renderToStaticMarkup(React.createElement(WritingFeedbackCard,{feedback}));
 expect(html).toContain('Retour sur ton texte');expect(html).toContain('1 passage à revoir parmi 1 vérifié.');
 expect(html).toContain('joue');expect(html).toContain('Avec les chats, écris jouent.');
 expect(html).toContain('Relire mon texte');expect(html).toContain('Tes prochains textes aideront à confirmer tes acquis.');
 expect(html).not.toContain('Bien acquis');
});
it('renders student text as text and handles one correct passage',()=>{
 const html=renderToStaticMarkup(React.createElement(WritingFeedbackCard,{feedback:{...feedback,text:'<script>alert(1)</script>',correctCount:1,passages:[{...feedback.passages[0],correct:true}]}}));
 expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');
 expect(html).toContain('Le passage vérifié est correct pour ce point.');
});
