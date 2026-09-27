import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {WeekStrip,WeeklyRecapCard,BadgeShelf,ClassGoalCard} from '@/components/motivation';
import {motivationDisplay} from './motivation-display';
const week=[{date:'2026-09-12',xp:12,goalCompleted:true,freezeUsed:false,isToday:true}];
const badges=[{key:'first',label:'Premiers pas',description:'Une première étape',emoji:'⭐',awardedAt:'2026-09-12',isNew:true}];
const recap={since:'2026-09-06',activeDays:2,goalDays:1,xp:12,securedNodes:['Le sujet','Le verbe','Le nom','Le pluriel'],reviews:2,readingSessions:1};
const classGoal={className:'Classe A',targetXp:100,earnedXp:12,activeMembers:2,members:8};
it('records the same visible and accessible wording as motivation cards',()=>{
 const display=motivationDisplay({motivation:{week,freezeAppliedFor:'2026-09-11',badges},recap,classGoal})!;
 const rendered=renderToStaticMarkup(React.createElement(React.Fragment,null,
  React.createElement(WeekStrip,{week,goalXp:10,freezeAppliedFor:'2026-09-11'}),
  React.createElement(WeeklyRecapCard,{recap}),React.createElement(BadgeShelf,{badges,onSeen:()=>{}}),React.createElement(ClassGoalCard,{goal:classGoal})));
 const text=rendered.replace(/<[^>]*>/g,'');
 expect(text).toContain(display.weekGoal);expect(rendered).toContain(display.days[0].description);
 expect(text).toContain(display.freeze);expect(text).toContain(display.newBadges);expect(rendered).toContain(display.badges[0]);
 expect(text).toContain(display.securedNodes);expect(text).toContain(display.classGoal!.title);expect(text).toContain(display.classGoal!.message);
 expect(display.days[0].description).toBe('samedi 12 septembre : 12 XP, objectif atteint');
 expect(display.securedNodes).toBe('Compétences sécurisées : Le sujet, Le verbe, Le nom et 1 autre(s).');
});
it('omits the whole section without motivation and handles empty or completed states',()=>{
 expect(motivationDisplay({motivation:null,recap,classGoal})).toBeNull();
 const display=motivationDisplay({motivation:{week:[],freezeAppliedFor:null,badges:[]},recap:{...recap,securedNodes:[]},classGoal:{...classGoal,earnedXp:100}})!;
 expect(display.newBadges).toBeNull();expect(display.freeze).toBeNull();expect(display.badgeCount).toBe('0 / 12');
 expect(display.classGoal!.message).toBe('Objectif atteint ensemble. Bravo à toute la classe.');
 expect(display.securedNodes).toContain('Aucune compétence');
});
