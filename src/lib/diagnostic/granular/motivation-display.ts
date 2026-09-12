import type {WeekDay,WeeklyRecap} from '@/components/motivation';
export const MOTIVATION_COPY={
 week:'Cette semaine',activity:'Activité des sept derniers jours',
 freezeHelp:'Chaque semaine complète te donne un gel de série (deux au maximum). Il se pose tout seul le jour où tu ne peux pas venir.',
 recap:'Bilan des 7 derniers jours',xp:'XP gagnés',days:'Jours actifs',reviews:'Révisions',readings:'Lectures',
 secured:'Compétences sécurisées : ',noneSecured:'Aucune compétence sécurisée cette semaine. Une session par jour suffit pour en débloquer.',
 badges:'Badges',seen:'Merci, c’est vu',noBadges:'Ton premier badge arrive avec ta première compétence sécurisée.',
 classGoal:'Objectif de classe',classReached:'Objectif atteint ensemble. Bravo à toute la classe.',
};
export const longActivityDate=(date:string)=>new Date(`${date}T00:00:00.000Z`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
export const activityDayLabel=(date:string)=>['D','L','M','M','J','V','S'][new Date(`${date}T00:00:00.000Z`).getUTCDay()];
export const activityDayText=(day:WeekDay)=>`${longActivityDate(day.date)} : ${day.xp} XP${day.goalCompleted?', objectif atteint':day.freezeUsed?', série protégée':''}`;
export const weekGoalText=(week:WeekDay[])=>`${week.filter(day=>day.goalCompleted).length} objectif(s) atteint(s)`;
export const freezeText=(date:string)=>`Ta série a été protégée ${longActivityDate(date)} grâce à un gel gagné.`;
export const securedNodeText=(nodes:string[])=>nodes.slice(0,3).join(', ')+(nodes.length>3?` et ${nodes.length-3} autre(s)`:'');
type Badge={label:string;description:string;emoji:string;isNew:boolean};
export const badgeCountText=(count:number)=>`${count} / 12`;
export const newBadgeText=(badges:Badge[])=>`Nouveau badge : ${badges.filter(b=>b.isNew).map(b=>`${b.emoji} ${b.label}`).join(' · ')}`;
export const badgeAccessibleText=(badge:Badge)=>`${badge.label} : ${badge.description}`;
type ClassGoal={className:string;targetXp:number;earnedXp:number;activeMembers:number;members:number};
export const classGoalTitle=(goal:ClassGoal)=>`Objectif de classe · ${goal.className}`;
export const classGoalTarget=(goal:ClassGoal)=>` / ${goal.targetXp} XP cette semaine`;
export const classGoalMessage=(goal:ClassGoal)=>goal.earnedXp>=goal.targetXp?MOTIVATION_COPY.classReached:`${goal.activeMembers} élève(s) sur ${goal.members} ont déjà contribué. Chaque XP compte, le tien aussi.`;
export function motivationDisplay(data:{motivation:{week:WeekDay[];freezeAppliedFor:string|null;badges:Badge[]}|null;recap:WeeklyRecap|null;classGoal:ClassGoal|null}){
 if(!data.motivation)return null;
 const {week,freezeAppliedFor,badges}=data.motivation;
 return {copy:MOTIVATION_COPY,weekGoal:weekGoalText(week),days:week.map(day=>({label:activityDayLabel(day.date),description:activityDayText(day)})),freeze:freezeAppliedFor?freezeText(freezeAppliedFor):null,
  badgeCount:badgeCountText(badges.length),newBadges:badges.some(b=>b.isNew)?newBadgeText(badges):null,badges:badges.map(badgeAccessibleText),
  securedNodes:data.recap?(data.recap.securedNodes.length?`${MOTIVATION_COPY.secured}${securedNodeText(data.recap.securedNodes)}.`:MOTIVATION_COPY.noneSecured):null,
  classGoal:data.classGoal?{title:classGoalTitle(data.classGoal),target:classGoalTarget(data.classGoal),message:classGoalMessage(data.classGoal)}:null};
}
