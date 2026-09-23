import type {Mode,SkillResult} from "./engine";

type ResultStatus=SkillResult["status"];
type Activity={action:"verify"|"learn"|"consolidate";titleFr:string;skillId?:string};
export type StudentResultEntry={status:ResultStatus;evidence:SkillResult["evidence"];label:string;assessmentAvailable?:boolean};

export const STUDENT_RESULT_SUMMARY_COPY={
 title:"Ton bilan en bref",
 description:"Voici ce que tes réponses montrent pour le moment.",
 checkingDescription:"Tes réponses donnent déjà des indices. Il faut encore quelques réponses pour confirmer un point.",
 emptyDescription:"Nous n’avons pas encore assez de réponses pour montrer un point précis.",
 mastered:"Ce que tu sais déjà faire",
 needsWork:"Ce que tu peux encore améliorer",
 checking:"Ce qu’il faut encore vérifier",
 notCheckedHelp:"D’autres points n’ont pas encore été vérifiés. Cela ne veut pas dire que tu ne sais pas les faire.",
 moreInDetails:"D’autres points apparaissent dans le détail.",
 nextActivity:"Ce que nous te proposons de travailler ensuite",
 moreActivities:"Voir les autres activités proposées",
 details:"Voir le détail de tous les points",
} as const;

export function studentResultSummary(results:readonly StudentResultEntry[]){
 const direct=results.filter(result=>result.evidence==="direct"&&result.assessmentAvailable!==false&&result.status!=="unknown");
 const labels=(statuses:readonly ResultStatus[])=>[...new Set(direct.filter(result=>statuses.includes(result.status)).map(result=>result.label))];
 const mastered=labels(["mastered"]),needsWork=labels(["missing","fragile"]),checking=labels(["uncertain"]);
 return {mastered,needsWork,checking,hasUnassessed:results.some(result=>result.evidence!=="direct"||result.assessmentAvailable===false||result.status==="unknown"),hasConfirmed:mastered.length+needsWork.length>0,hasDirect:direct.length>0};
}

export const studentEvidenceCoverageText=(confirmed:number,total:number)=>`${confirmed} point${confirmed===1?"":"s"} vérifié${confirmed===1?"":"s"} sur ${total}`;

const PINNED_SKILL_TITLE_BASES:Readonly<Record<string,string>>={
 "Analyser l'accord déterminant-nom":"Choisir le bon petit mot devant un nom",
 "Identifier les traits de personne-nombre":"Choisir le mot qui peut remplacer le sujet",
 "Analyser l'accord nom-adjectif":"Choisir la bonne forme du nom et de l’adjectif",
 "Reconnaître une subordonnée relative":"Repérer les mots qui ajoutent une précision sur un nom",
 "Accorder le participe passé avec un COD antéposé":"Choisir la bonne forme du verbe avec avoir",
};
const PINNED_COD_FACETS:Readonly<Record<string,string>>={
 "Absence de COD":"Aucun mot à reprendre",
 "COD placé après":"Mot à reprendre placé après",
 "COD placé avant":"Mot à reprendre placé avant",
};

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
 const [pinnedBase,...pinnedFacets]=trimmed.replaceAll("’","'").split(" — ");
 const plainPinnedBase=PINNED_SKILL_TITLE_BASES[pinnedBase];
 if(plainPinnedBase){
  const plainFacets=pinnedBase==="Accorder le participe passé avec un COD antéposé"
   ?pinnedFacets.map(facet=>PINNED_COD_FACETS[facet]??facet)
   :pinnedFacets;
  return [plainPinnedBase,...plainFacets].join(" — ");
 }
 for(const [pattern,replacement] of replacements)if(pattern.test(trimmed))return trimmed.replace(pattern,replacement);
 return trimmed;
}

export function studentSummaryLabel(label:string,mode:Mode){
 const title=studentSkillTitle(label),plainMode={recognition:"repérer",production:"écrire",interpretation:"comprendre",independent_production:"utiliser dans ton texte"}[mode];
 if(/^(?:Choisir|Comprendre)\b/u.test(title))return title;
 const matchingStart={recognition:/^Repérer\b/u,production:/^(?:Écrire|Accorder|Corriger|Construire)\b/u,interpretation:/^Comprendre\b/u,independent_production:/^Utiliser\b/u}[mode];
 return matchingStart.test(title)?title:`${title} (${plainMode})`;
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
