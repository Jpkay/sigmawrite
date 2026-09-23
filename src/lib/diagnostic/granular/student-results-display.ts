import type {SkillResult} from "./engine";

type ResultStatus=SkillResult["status"];
type Activity={action:"verify"|"learn"|"consolidate";titleFr:string;skillId?:string};

export const STUDENT_RESULT_SUMMARY_COPY={
 title:"Ton bilan en bref",
 description:"Chaque point est rangé selon les réponses que tu as déjà données.",
 mastered:"Ce que tu sais déjà faire",
 needsWork:"Ce que tu peux encore améliorer",
 checking:"Ce qu’il faut encore vérifier",
 notChecked:"Pas encore vérifié",
 notCheckedHelp:"Un point pas encore vérifié n’est pas une difficulté.",
 nextActivity:"Ce que nous te proposons de travailler ensuite",
 moreActivities:"Voir les autres activités proposées",
 details:"Voir le détail de tous les points",
} as const;

export function studentResultSummary(results:readonly {status:ResultStatus}[]){
 return results.reduce((summary,result)=>{
  if(result.status==="mastered")summary.mastered++;
  else if(result.status==="missing"||result.status==="fragile")summary.needsWork++;
  else if(result.status==="uncertain")summary.checking++;
  else summary.notChecked++;
  return summary;
 },{mastered:0,needsWork:0,checking:0,notChecked:0});
}

export const studentPointCount=(count:number)=>`${count} point${count===1?"":"s"}`;

/** Plain display wording for existing pinned releases. Source labels and IDs stay unchanged. */
export function studentSkillTitle(label:string){
 const replacements:Array<[RegExp,string]>=[
  [/^Reconnaître\b/u,"Repérer"],
  [/^Identifier\b/u,"Repérer"],
  [/^Interpréter\b/u,"Comprendre"],
  [/^Produire\b/u,"Écrire"],
  [/^Construire\b/u,"Écrire"],
  [/^Localiser\b/u,"Trouver"],
  [/^Employer\b/u,"Utiliser"],
  [/^Mobiliser\b/u,"Utiliser"],
  [/^Analyser\b/u,"Observer"],
 ];
 const trimmed=label.trim();
 for(const [pattern,replacement] of replacements)if(pattern.test(trimmed))return trimmed.replace(pattern,replacement);
 return trimmed;
}

export function studentActivityTitle(activity:Activity){
 const source=`${activity.skillId??""} ${activity.titleFr}`.toLocaleLowerCase("fr");
 let title=
  /(?:choisir_auxiliaire_compose|reconnaitre_auxiliaire|auxiliaire|avoir.+être|être.+avoir)/u.test(source)?"choisir entre avoir et être":
  /(?:construction_accord_nom_adjectif|accorder_adjectif_nom|accord.+adjectif|adjectif.+accord|nom.+adjectif)/u.test(source)?"accorder correctement un nom et un adjectif":
  /(?:construction_phrase_canonique|ordre d’une phrase simple)/u.test(source)?"construire une phrase simple":
  /(?:deduire_mot_|choisir_sens_polysemique|vocabulaire.+contexte|sens d’un mot)/u.test(source)?"comprendre le sens d’un mot grâce au contexte":
  /(?:reconnaitre_radical_terminaison|choisir.+forme.+verbe|forme.+complète.+phrase)/u.test(source)?"trouver le bon verbe":
  studentSkillTitle(activity.titleFr);
 const verification=title.match(/^Vérifier\s+(.+)$/u);
 if(verification)title=studentSkillTitle(verification[1]).replace(/^./u,letter=>letter.toLocaleLowerCase("fr")).replace(/^le\b/u,"repérer le").replace(/^la\b/u,"repérer la").replace(/^les\b/u,"repérer les").replace(/^l’/u,"repérer l’");
 title=title.charAt(0).toLocaleLowerCase("fr")+title.slice(1);
 const prefix=activity.action==="verify"?"Question":activity.action==="learn"?"Leçon":"Entraînement";
 return `${prefix} : ${title}`;
}
