import type {MicroLesson} from '@/lib/content/micro-lessons';
export const REPAIR_COPY={missing:'Micro-leçon introuvable',home:"Retour à l'accueil",description:'Réparation des bases — 2 minutes.',remember:"Ce qu'il faut retenir",practice:"Je m'entraîne",done:'Micro-leçon terminée 👍',next:'Continuer',return:'Retour au texte',verify:'Vérifier',saving:'Enregistrement…',finish:'Terminer',following:'Suivant',error:"Le résultat n'a pas pu être enregistré. Réessaie."};
export const repairProgress=(index:number,total:number)=>`Entraînement ${index+1} / ${total}`;
export const repairCompletion=(title:string)=>`Tu as terminé « ${title} ». D’autres questions permettront de vérifier ce que tu sais faire sans aide.`;
export function repairDisplay(lesson:MicroLesson|null){
 const total=lesson?lesson.questions.length+1:0;
 return {copy:REPAIR_COPY,progress:lesson?lesson.questions.map((_,index)=>repairProgress(index,lesson.questions.length)):[],scores:Array.from({length:total+1},(_,score)=>`${score} / ${total}`),completion:lesson?repairCompletion(lesson.title):null};
}
