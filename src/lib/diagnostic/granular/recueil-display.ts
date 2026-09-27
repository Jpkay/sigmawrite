import type {RecueilEntry} from '@/lib/actions/student';
export const RECUEIL_COPY={eyebrow:'Mes écrits',title:'Mon recueil',print:'Imprimer le recueil',empty:'Pas encore de texte abouti ce trimestre. Une production réussie ou un résumé révisé apparaîtra ici.',book:'Recueil'};
export const recueilDate=(iso:string)=>new Date(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
export function recueilDisplay(since:string,entries:RecueilEntry[],displayName:string|null|undefined){
 return {copy:RECUEIL_COPY,description:`Tes textes aboutis depuis le ${recueilDate(since)}. Imprime-le ou enregistre-le en PDF.`,author:displayName??'Élève',count:`${entries.length} texte(s)`,entries:entries.map((entry,index)=>({kind:`${index+1} · ${entry.kind==='production'?'Production':'Résumé'}`,date:recueilDate(entry.at)+(entry.note?` · ${entry.note}`:'')}))};
}
