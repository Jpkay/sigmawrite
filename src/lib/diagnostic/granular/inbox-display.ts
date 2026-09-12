import type {StudentNotification} from '@/lib/actions/student';
export const INBOX_COPY={loading:'Chargement…',loadError:'Les messages n’ont pas pu être chargés. Réessaie plus tard.',actionError:'Le message n’a pas pu être marqué comme lu. Réessaie.',allRead:'Tout est lu.',markAll:'Tout marquer comme lu',empty:'Aucun message pour l’instant. Tes rappels de révision arriveront ici.',new:'nouveau',read:'Lu',open:'Ouvrir'};
export const INBOX_KINDS:Record<string,{label:string;href?:string;cta?:string}>={
 retrieval_due:{label:'Révision',href:'/student/memory',cta:'Réviser'},weekly_recap:{label:'Bilan',href:'/student',cta:'Voir'},teacher_comment:{label:'Enseignant'},assignment:{label:'À faire',href:'/student',cta:'Ouvrir'},
};
export const inboxKind=(kind:string)=>INBOX_KINDS[kind]??{label:'Message'};
export const inboxUnread=(count:number)=>count>0?`${count} non lu(s)`:INBOX_COPY.allRead;
export const inboxDate=(iso:string)=>new Date(iso).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
export function inboxDisplay(rows:StudentNotification[]){
 const unread=rows.filter(row=>!row.readAt).length;
 return {copy:INBOX_COPY,kinds:INBOX_KINDS,unreadStates:Array.from({length:unread+1},(_,count)=>inboxUnread(count)),rows:rows.map(row=>({kind:inboxKind(row.kind).label,date:inboxDate(row.createdAt),heading:`${inboxKind(row.kind).label} · ${inboxDate(row.createdAt)}`}))};
}
