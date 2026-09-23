import type {EvidenceSkill,V3Assessment} from "./v3-adapter";

const PLAIN_SKILL_LABELS:Readonly<Record<string,string>>={
 distinguer_personne_nombre:"Choisir la forme du verbe qui va avec le sujet",
 reconnaitre_radical_terminaison:"Repérer le début et la fin d’un verbe",
 reconnaitre_present_indicatif:"Reconnaître ce qui se passe maintenant",
 produire_present_indicatif:"Écrire un verbe pour ce qui se passe maintenant",
 reconnaitre_futur_proche:"Reconnaître ce qui va se passer",
 produire_futur_proche:"Écrire ce qui va se passer avec aller et un autre verbe",
 interpreter_futur_proche:"Comprendre ce que aller suivi d’un verbe annonce",
 construction_accord_determinant_nom:"Choisir le bon petit mot devant un nom",
 accorder_determinant_nom_ecrit:"Écrire correctement le petit mot et le nom",
 reconnaitre_auxiliaire:"Repérer avoir ou être quand il aide à conjuguer un autre verbe",
 choisir_auxiliaire_compose:"Choisir avoir ou être pour conjuguer avec deux mots",
 construction_accord_nom_adjectif:"Choisir la forme de l’adjectif qui va avec le nom",
 accorder_adjectif_nom_ecrit:"Écrire l’adjectif pour qu’il aille avec le nom",
 construction_phrase_canonique:"Repérer qui fait l’action et ce qui se passe",
 identifier_sujet_verbe:"Repérer qui ou ce qui fait l’action",
 deduire_mot_definition_locale:"Comprendre un mot grâce à l’explication donnée dans le texte",
 identifier_complement_direct:"Repérer ce qui complète directement le verbe",
 produire_pronom_cod:"Remplacer un complément par le, la, l’ ou les",
 produire_pronom_coi_personne:"Remplacer un nom de personne par lui ou leur",
 distinguer_pronom_cod_coi:"Choisir entre le, la, les, lui et leur",
 construction_subordonnee_relative:"Repérer les mots qui précisent un nom",
 accorder_participe_avoir_cod:"Choisir la fin du mot après avoir selon ce qui vient avant",
 accorder_participe_cod_antepose:"Choisir la fin du mot quand le complément vient avant",
};

const PLAIN_FACET_LABELS:Readonly<Record<string,string>>={
 "Choisir avoir":"avec avoir",
 "Choisir être":"avec être",
 "Verbe changeant d’auxiliaire selon son emploi":"selon le sens du verbe",
 "Verbe pronominal":"avec se ou s’",
 "COD placé avant":"quand le complément est avant",
 "COD placé après":"quand le complément est après",
 "Absence de COD":"quand rien ne complète directement le verbe",
 "COD repris par un pronom":"quand le complément est remplacé par un petit mot",
 "COD repris par que":"quand que reprend le complément",
};

const PLAIN_TEACHING_TITLES:Readonly<Record<string,string>>={
 "Réunir deux phrases avec une relative":"Réunir deux phrases avec qui, que, où ou dont",
 "Repérer une proposition relative":"Repérer les mots qui précisent un nom",
 "Garder le participe sans accord quand le COD vient après":"Garder la même fin quand le complément vient après",
 "Garder le participe sans accord quand il n’y a pas de COD":"Garder la même fin quand rien ne complète directement le verbe",
};

type TeachingPracticeCopy={
 answerFr:string;
 choices?:string[];
 explanationFr:string;
 hintFr:string;
 id:string;
 promptFr:string;
};

type TeachingLessonCopy={
 nodeKey:string;
 practice?:TeachingPracticeCopy[];
 titleFr:string;
};

const PAST_FORM_CHOICES:Readonly<Record<string,string>>={
 "Passé simple":"Une action terminée dans un récit, en un seul mot comme « elle marcha ».",
 "Imparfait":"Une habitude ou une situation passée, en un seul mot comme « elle marchait ».",
 "Passé composé":"Une action terminée avec deux mots, comme « elle a marché ».",
 "Présent":"Ce qui se passe maintenant ou d’habitude, comme « elle marche ».",
};

const QUE_FORM_CHOICES:Readonly<Record<string,string>>={
 "Subjonctif présent":"Une action souhaitée ou nécessaire après « que », comme dans « Je veux qu’il vienne ».",
 "Indicatif présent":"Un fait présenté comme certain maintenant, comme dans « Je sais qu’il vient ».",
 "Indicatif imparfait":"Une habitude ou une situation passée, comme dans « Je savais qu’il venait ».",
 "Subjonctif passé":"Une action déjà terminée après « que », comme dans « Je regrette qu’il soit venu ».",
};

const SIMPLE_TIME_CHOICES:Readonly<Record<string,string>>={
 "À l’imparfait.":"Une action ou une habitude passée en un mot, comme « elle marchait ».",
 "Au présent.":"Une forme comme « elle marche », même si la phrase peut parler de demain.",
 "Au présent de l’indicatif.":"Une forme comme « elle marche », même si la phrase peut parler de demain.",
 "Au futur simple.":"Ce qui arrivera plus tard en un mot, comme « elle marchera ».",
 "Au passé composé.":"Une action terminée avec deux mots, comme « elle a marché ».",
};

function revision45PracticePrompt(nodeKey:string,promptFr:string):string{
 if(nodeKey==="produire_subjonctif_present_frequent")return promptFr.replace(
  /^Complète avec (.+?) au subjonctif présent\. Écris seulement le verbe : /,
  "Dans cette phrase avec « que », complète avec $1, comme dans « il faut que tu rêves ». Écris seulement le verbe qui manque : ",
 );
 if(nodeKey==="produire_plus_que_parfait")return promptFr.replace(
  /^Complète avec (.+?) au plus-que-parfait\. Écris le groupe verbal manquant : /,
  "L’action était déjà terminée avant un autre moment passé. Complète avec $1 en utilisant avoir ou être, comme dans « avait rêvé » ou « était tombé ». Écris tout le groupe qui manque : ",
 );
 if(nodeKey==="produire_conditionnel_present")return promptFr
  .replace(/^Imagine cette situation\. Complète avec (.+?) au conditionnel présent : /,"Imagine ce qui se passerait. Complète avec $1, comme dans « je rêverais » : ")
  .replace(/^Complète avec (.+?) au conditionnel présent\. Écris seulement le verbe : /,"Imagine ce qui se passerait. Complète avec $1, comme dans « je rêverais ». Écris seulement le verbe : ");
 if(nodeKey==="produire_imparfait")return promptFr
  .replace(/^Tu racontes une habitude passée\. Complète avec (.+?) à l’imparfait : /,"Tu racontes une habitude passée. Complète avec $1, comme dans « je rêvais » : ")
  .replace(/^Le récit est au passé\. Complète avec (.+?) à l’imparfait\. Écris seulement le verbe : /,"Le récit décrit ce qui se passait. Complète avec $1, comme dans « je rêvais ». Écris seulement le verbe : ");
 if(nodeKey==="produire_passe_simple")return promptFr.replace(
  /^Complète ce récit avec (.+?) au passé simple\. Écris seulement le verbe : /,
  "Dans ce récit, complète avec $1 en un seul mot, comme « marcha ». Écris seulement le verbe : ",
 );
 if(nodeKey==="produire_passe_compose")return promptFr.replace(
  /^Complète avec (.+?) au passé composé\. Écris le groupe verbal manquant : /,
  "L’action est terminée. Complète avec $1 en utilisant avoir ou être, comme dans « a rêvé » ou « est tombé ». Écris tout le groupe qui manque : ",
 ).replace(/ Sujet masculin singulier\.$/," La fin du mot doit aller avec « il ».")
  .replace(/ Sujet féminin singulier\.$/," La fin du mot doit aller avec « elle ».")
  .replace(/ Sujet masculin pluriel\.$/," La fin du mot doit aller avec « ils ».")
  .replace(/ Sujet féminin pluriel\.$/," La fin du mot doit aller avec « elles ».");
 if(nodeKey==="construction_phrase_canonique")return promptFr
  .replace("Quel groupe est le complément du verbe ?","Quels mots disent ce que les clientes choisissent ?")
  .replace("Quel élément manque pour suivre le modèle sujet, verbe, complément ?","Quel élément manque pour faire une phrase complète ?")
  .replace("Quel est le groupe sujet entier ?","Quels mots disent qui fait l’action ?")
  .replace("Pourquoi cette phrase peut-elle être complète ?","La phrase dit déjà qui dort et ce qu’il fait. Pourquoi est-elle complète ?")
  .replace("Remets ces groupes dans l’ordre sujet, verbe, complément.","Remets ces groupes dans cet ordre : qui fait l’action, ce qu’il fait, puis ce qui complète la phrase.");
 if(nodeKey==="identifier_complement_direct")return promptFr.replace(
  "Quel est le COD complet ? S’il n’y en a pas, choisis « Aucun COD ».",
  "Sur qui ou sur quoi porte directement l’action ? Choisis tous les mots de la réponse. Si l’action ne porte directement sur rien, choisis « Aucun ».",
 );
 if(nodeKey==="identifier_sujet_verbe")return promptFr.replace(
  /Quel est le groupe sujet complet du verbe « ([^»]+) » \?/,
  "Quels mots nomment la personne ou la chose qui va avec le verbe « $1 » ?",
 );
 if(nodeKey==="reconnaitre_radical_terminaison")return promptFr
  .replace(/^Sépare le radical et la terminaison dans (.+)\.$/,"Sépare le début du verbe et la fin qui change dans $1.")
  .replace(/quelle est la terminaison entière \?$/,"quelles lettres forment toute la fin qui change avec le sujet ?")
  .replace(/quel est le radical \?$/,"quelles lettres forment le début du verbe avant la fin qui change ?");
 if(nodeKey==="construction_pronom_sujet")return promptFr.replace(
  /Remplace («[^»]+») par un pronom sujet\./,
  "Remplace $1 par il, elle, ils, elles, nous ou vous.",
 );
 if(nodeKey==="reconnaitre_passe_compose")return promptFr.replace(
  "Quelle phrase est au passé composé ?",
  "Quelle phrase raconte une action terminée avec deux mots, comme « a rêvé » ou « est tombé » ?",
 );
 if(nodeKey==="reconnaitre_plus_que_parfait")return promptFr.replace(
  "Quelle phrase est au plus-que-parfait ?",
  "Quelle phrase dit qu’une action était déjà terminée, avec deux mots comme « avait rêvé » ou « était tombé » ?",
 );
 if(nodeKey==="reconnaitre_conditionnel_present")return promptFr.replace(
  "Quelle forme est au conditionnel présent ?",
  "Quelle forme dit ce qui se passerait, comme « je rêverais » ou « nous rêverions » ?",
 );
 if(nodeKey==="reconnaitre_passe_simple")return promptFr.replace(
  /À quel temps est le verbe « ([^»]+) » \?/,
  "Quelle description correspond au verbe « $1 » dans cette phrase ?",
 );
 if(nodeKey==="reconnaitre_subjonctif_present")return promptFr.replace(
  /Dans cette phrase, à quel mode et à quel temps est « ([^»]+) » \?/,
  "Quelle description correspond au groupe « $1 » dans cette phrase ?",
 );
 if(nodeKey==="reconnaitre_imparfait")return promptFr
  .replace("Quelle phrase contient un verbe à l’imparfait ?","Quelle phrase décrit une situation ou une habitude passée avec un seul verbe, comme « rêvait » ?")
  .replace("Quelle forme est à l’imparfait ?","Quelle forme décrit une situation ou une habitude passée, comme « rêvait » ?")
  .replace("Quel verbe est à l’imparfait ?","Quel mot décrit la situation passée ?")
  .replace("Quelle phrase emploie l’imparfait seul ?","Quelle phrase décrit la situation passée avec un seul verbe ?")
  .replace("Quelle forme est à l’imparfait, et non au conditionnel présent ?","Quelle forme décrit une situation passée, sans dire ce qui se passerait ?")
  .replace("Nous marchions le long du canal. À quel temps marchions est-il conjugué ?","Nous marchions le long du canal. Quelle description correspond à « marchions » ?");
 if(nodeKey==="reconnaitre_present_indicatif")return promptFr
  .replace("Quelle phrase contient le présent de l’indicatif ?","Quelle phrase parle de ce qui se passe maintenant ou d’habitude, avec un seul verbe ?")
  .replace("Quelle phrase contient un verbe au présent ?","Quelle phrase parle de ce qui se passe maintenant ou d’habitude, avec un seul verbe ?")
  .replace("Demain, elle tricote chez sa grand-mère.\n\nÀ quel temps le verbe tricote est-il conjugué ?","Demain, elle tricote chez sa grand-mère.\n\nQuelle description correspond à « tricote » dans cette phrase ?")
  .replace("Quel groupe est au passé composé, et non au présent ?","Quel groupe de deux mots raconte l’action terminée ?")
  .replace("Quelle phrase est au présent ?","Quelle phrase parle de ce qui se passe maintenant ou d’habitude, avec un seul verbe ?")
  .replace("Que peux-tu dire de bricolent ?","Quelle description correspond à « bricolent » dans cette phrase ?");
 if(nodeKey==="reconnaitre_futur_simple")return promptFr
  .replace("Quelle phrase contient un futur simple ?","Quelle phrase parle de plus tard avec une forme comme « chanteras » ?")
  .replace("Quelle phrase emploie le futur simple ?","Quelle phrase parle de plus tard avec une forme comme « auras » ?")
  .replace("Nous serons à l’accueil. À quel temps serons est-il conjugué ?","Nous serons à l’accueil. Quelle description correspond à « serons » ?")
  .replace("Quelle forme est au futur simple ?","Quelle forme dit ce qui arrivera plus tard ?")
  .replace("Quelle forme est au futur simple avec je ?","Quelle forme avec « je » dit ce qui arrivera plus tard ?")
  .replace("Quel groupe est au futur simple ?","Quel mot dit ce qui arrivera plus tard ?");
 return promptFr;
}

function replaceChoiceLabels<T extends TeachingPracticeCopy>(practice:T,labels:Readonly<Record<string,string>>):T{
 return {...practice,answerFr:labels[practice.answerFr]??practice.answerFr,choices:practice.choices?.map(choice=>labels[choice]??choice)};
}

function revision45PracticeCopy<T extends TeachingPracticeCopy>(nodeKey:string,practice:T):T{
 const rewritten={...practice,promptFr:revision45PracticePrompt(nodeKey,practice.promptFr)};
 if(nodeKey==="reconnaitre_passe_simple")return replaceChoiceLabels(rewritten,PAST_FORM_CHOICES);
 if(nodeKey==="reconnaitre_subjonctif_present")return replaceChoiceLabels(rewritten,QUE_FORM_CHOICES);
 if(nodeKey==="reconnaitre_imparfait"&&practice.id==="imparfait-guide-2")return replaceChoiceLabels(rewritten,SIMPLE_TIME_CHOICES);
 if(nodeKey==="reconnaitre_futur_simple"&&practice.id==="futur-simple-guide-2")return replaceChoiceLabels(rewritten,SIMPLE_TIME_CHOICES);
 if(nodeKey==="reconnaitre_present_indicatif"&&practice.id==="present-foundation-3")return replaceChoiceLabels(rewritten,SIMPLE_TIME_CHOICES);
 if(nodeKey==="reconnaitre_present_indicatif"&&practice.id==="present-foundation-6")return {...rewritten,
  answerFr:"La phrase parle d’une habitude actuelle : ils bricolent régulièrement.",
  choices:[
   "La phrase parle d’une habitude actuelle : ils bricolent régulièrement.",
   "La phrase annonce seulement ce qu’ils feront plus tard.",
   "La phrase raconte une action déjà terminée.",
   "Le mot « bricolent » donne le nom du verbe, comme « bricoler ».",
  ],
 };
 if(nodeKey==="identifier_complement_direct")return {...rewritten,
  answerFr:practice.answerFr==="Aucun COD"?"Aucun":practice.answerFr,
  choices:practice.choices?.map(choice=>choice==="Aucun COD"?"Aucun":choice),
 };
 if(nodeKey!=="construction_phrase_canonique")return rewritten;
 if(practice.id==="canonical-recognition-guide-1")return {...rewritten,
  answerFr:"Le gardien fait l’action ; « ferme » dit ce qu’il fait ; l’action porte sur le portail.",
  choices:[
   "Le gardien fait l’action ; « ferme » dit ce qu’il fait ; l’action porte sur le portail.",
   "Le portail fait l’action ; « ferme » dit ce qu’il fait ; l’action porte sur le gardien.",
   "« Ferme » fait l’action ; le portail dit ce qu’il fait.",
   "Aucun mot ne dit ce qui se passe.",
  ],
 };
 if(practice.id==="canonical-recognition-guide-3")return {...rewritten,
  answerFr:"Un mot qui dit ce qui se passe.",
  choices:["Un mot qui dit ce qui se passe.","Un deuxième groupe qui dit qui fait l’action.","Un mot indiquant demain.","Une deuxième virgule."],
 };
 if(practice.id==="canonical-recognition-guide-5")return {...rewritten,
  answerFr:"Elle dit qui dort et ce qui se passe.",
  choices:["Elle dit qui dort et ce qui se passe.","« Dort » indique où se trouve le bébé.","« Le bébé » dit ce qui se passe.","Toutes les phrases doivent contenir trois groupes."],
 };
 return rewritten;
}

export function revision45SkillCopy(skills:readonly EvidenceSkill[]):EvidenceSkill[]{
 return skills.map(skill=>{
  const plain=PLAIN_SKILL_LABELS[skill.nodeKey];
  if(!plain)return {...skill};
  const separator=skill.labelFr.indexOf(" — ");
  const facet=separator<0?undefined:skill.labelFr.slice(separator+3);
  return {...skill,labelFr:facet?`${plain} — ${PLAIN_FACET_LABELS[facet]??facet}`:plain};
 });
}

export function revision45TeachingCopy<T extends TeachingLessonCopy>(lessons:readonly T[]):T[]{
 return lessons.map(lesson=>{
  const practice=lesson.practice?.map(item=>revision45PracticeCopy(lesson.nodeKey,item));
  return {...lesson,titleFr:PLAIN_TEACHING_TITLES[lesson.titleFr]??lesson.titleFr,...(practice?{practice}:{})};
 });
}

export function applyRevision45AssessmentCopy(assessment:V3Assessment):V3Assessment{
 return {...assessment,skills:revision45SkillCopy(assessment.skills)};
}
