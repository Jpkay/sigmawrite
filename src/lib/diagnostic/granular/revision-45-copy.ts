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

export function revision45SkillCopy(skills:readonly EvidenceSkill[]):EvidenceSkill[]{
 return skills.map(skill=>{
  const plain=PLAIN_SKILL_LABELS[skill.nodeKey];
  if(!plain)return {...skill};
  const separator=skill.labelFr.indexOf(" — ");
  const facet=separator<0?undefined:skill.labelFr.slice(separator+3);
  return {...skill,labelFr:facet?`${plain} — ${PLAIN_FACET_LABELS[facet]??facet}`:plain};
 });
}

export function revision45TeachingCopy<T extends {titleFr:string}>(lessons:readonly T[]):T[]{
 return lessons.map(lesson=>({...lesson,titleFr:PLAIN_TEACHING_TITLES[lesson.titleFr]??lesson.titleFr}));
}

export function applyRevision45AssessmentCopy(assessment:V3Assessment):V3Assessment{
 return {...assessment,skills:revision45SkillCopy(assessment.skills)};
}
