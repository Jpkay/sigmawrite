import {FRAMEWORK_LABELS,type CurriculumTag} from './tags';
export const CURRICULUM_TAG_LABEL='Alignement programme';
export function curriculumTagDisplay(tag:CurriculumTag,compact=false){
 const framework=FRAMEWORK_LABELS[tag.framework];
 const label=tag.labelFr.length>60?`${tag.labelFr.slice(0,60)}…`:tag.labelFr;
 return {framework,label,visible:compact?framework:`${framework}· ${label}`,title:tag.labelFr};
}
