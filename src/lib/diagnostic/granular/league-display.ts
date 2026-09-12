import type {ClassLeague} from '@/lib/actions/student';
export const TIER_LABELS:Record<string,{label:string;emoji:string;next:number|null}>={
 bronze:{label:'Bronze',emoji:'🥉',next:250},argent:{label:'Argent',emoji:'🥈',next:750},or:{label:'Or',emoji:'🥇',next:2000},platine:{label:'Platine',emoji:'💠',next:5000},diamant:{label:'Diamant',emoji:'💎',next:null},
};
export const LEAGUE_COPY={first:'1re place',streak:'Série de jours',place:'Ta place cette semaine : ',hide:'Cacher mon nom',show:'Afficher mon nom',help:'Classement par XP de la semaine, puis par série. Le lundi, tout le monde repart à zéro ; la ligue, elle, se garde.'};
export const leagueRowName=(row:{name:string;isMe:boolean})=>row.name+(row.isMe?' (toi)':'');
export const leagueXp=(xp:number)=>`${xp} XP`;
export function leagueDisplay(league:ClassLeague){
 if(!league)return null;
 const me=league.me,tier=me?(TIER_LABELS[me.tier]??TIER_LABELS.bronze):null;
 return {copy:LEAGUE_COPY,title:`Ligue de la classe · ${league.className}`,week:`Semaine du ${new Date(`${league.weekStart}T00:00:00Z`).toLocaleDateString('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'})}`,
  tier:tier?`${tier.emoji} Ligue ${tier.label}`:null,next:me&&tier?(tier.next?`${Math.max(0,tier.next-me.totalXp)} XP avant la ligue suivante`:'Ligue la plus haute'):null,
  place:me?`${LEAGUE_COPY.place}${me.rank}${me.rank===1?'re':'e'} / ${league.rows.length}`:null,
  rows:league.rows.slice(0,10).map(row=>({name:leagueRowName(row),xp:leagueXp(row.weekXp)})),
  outsideTop:me&&me.rank>10?`… et toi en ${me.rank}e place avec ${me.weekXp} XP. Une lecture ou une dictée et tu remontes.`:null};
}
