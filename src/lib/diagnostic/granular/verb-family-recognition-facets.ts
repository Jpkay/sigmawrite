import type {AssessmentFacet} from './facets';
const nodeKey='classer_famille_verbale';
/** Standalone authoring refinement, not included in the runtime facet catalogue. */
export const VERB_FAMILY_RECOGNITION_FACETS:readonly AssessmentFacet[]=[
 {key:`${nodeKey}::construction:er`,nodeKey,dimension:'construction',value:'er',labelFr:'Reconnaître le modèle chanter'},
 {key:`${nodeKey}::construction:ir`,nodeKey,dimension:'construction',value:'ir',labelFr:'Reconnaître le modèle finir'},
 {key:`${nodeKey}::construction:other`,nodeKey,dimension:'construction',value:'other',labelFr:'Reconnaître les autres modèles'},
];
