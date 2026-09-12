import type {AssessmentFacet} from './facets';
import type {TargetTeachingContent} from './teaching-content';
import {VERB_FAMILY_LABELS} from './verb-family-recognition-drafts';
const nodeKey='classer_famille_verbale';
/** Standalone authoring refinement, not included in the runtime facet catalogue. */
export const VERB_FAMILY_RECOGNITION_FACETS:readonly AssessmentFacet[]=[
 {key:`${nodeKey}::construction:er`,nodeKey,dimension:'construction',value:'er',labelFr:'Reconnaître le modèle chanter'},
 {key:`${nodeKey}::construction:ir`,nodeKey,dimension:'construction',value:'ir',labelFr:'Reconnaître le modèle finir'},
 {key:`${nodeKey}::construction:other`,nodeKey,dimension:'construction',value:'other',labelFr:'Reconnaître les autres modèles'},
];
type Family=keyof typeof VERB_FAMILY_LABELS;
const guided:Record<Family,Array<[string,string,string,Family]>>={
 er:[['crier','crie','crions','er'],['visiter','visite','visitons','er'],['fermer','ferme','fermons','er'],['prêter','prête','prêtons','er'],['bâtir','bâtis','bâtissons','ir'],['venir','viens','venons','other']],
 ir:[['agir','agis','agissons','ir'],['obéir','obéis','obéissons','ir'],['ralentir','ralentis','ralentissons','ir'],['atterrir','atterris','atterrissons','ir'],['penser','pense','pensons','er'],['dire','dis','disons','other']],
 other:[['tenir','tiens','tenons','other'],['lire','lis','lisons','other'],['boire','bois','buvons','other'],['mettre','mets','mettons','other'],['porter','porte','portons','er'],['avertir','avertis','avertissons','ir']],
};
const first=(verb:string)=>/^[aeiouéèêàâîïôûù]/i.test(verb)?`j’${verb}`:`je ${verb}`;
const explanations:Record<Family,string>={
 er:'L’infinitif se termine par -er. La forme avec je se termine par -e et celle avec nous par -ons, comme chanter. Ces formes suivent ce modèle.',
 ir:'L’infinitif se termine par -ir. On retrouve -is avec je et -issons avec nous, comme finir.',
 other:'Les formes données ne suivent ni le modèle chanter ni le modèle finir. Il faut reconnaître un autre modèle de conjugaison.',
};
const lessons:TargetTeachingContent[]=[
 {id:'french-v3-teaching:verb-family:er',nodeKey,facetKey:`${nodeKey}::construction:er`,mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître les verbes comme chanter',learnerQuestionFr:'Que remarques-tu dans chanter, je chante, nous chantons ?',steps:[
  {exampleFr:'chanter : je chante, nous chantons',explanationFr:'Chanter nomme l’action : c’est l’infinitif. Chante et chantons sont deux formes du présent. La base chant reste reconnaissable et la fin change.'},
  {exampleFr:'aimer : j’aime, nous aimons',explanationFr:'Aimer suit le même modèle : -er à l’infinitif, -e avec je et -ons avec nous. On peut regrouper des verbes qui se conjuguent de cette façon.'},
  {exampleFr:'venir : je viens, nous venons',explanationFr:'La fin -ons ne suffit pas. Venir ne se termine pas par -er et viens ne suit pas le modèle chante. Compare l’infinitif et plusieurs formes.'},
 ],takeawayFr:'Compare l’infinitif et les formes données avec le modèle chanter.',boundaryFr:'La fin -er seule ne suffit pas pour tous les verbes. Des changements d’orthographe existent aussi. Reconnaître ce modèle ne prouve pas que tu sais écrire toutes les formes à tous les temps.',practice:[]},
 {id:'french-v3-teaching:verb-family:ir',nodeKey,facetKey:`${nodeKey}::construction:ir`,mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître les verbes comme finir',learnerQuestionFr:'Pourquoi trouve-t-on iss dans nous finissons ?',steps:[
  {exampleFr:'finir : je finis, nous finissons',explanationFr:'Finir nomme l’action sans personne : c’est l’infinitif. Au présent, on écrit finis avec je et finissons avec nous. Le morceau iss apparaît dans cette dernière forme.'},
  {exampleFr:'unir : j’unis, nous unissons',explanationFr:'Unir suit le même modèle : -ir à l’infinitif, -is avec je et -issons avec nous.'},
  {exampleFr:'venir : je viens, nous venons',explanationFr:'Venir se termine aussi par -ir, mais on dit venons, pas venissons. Tous les verbes en -ir ne suivent donc pas finir.'},
 ],takeawayFr:'Pour reconnaître le modèle finir, regarde le -ir de l’infinitif et compare les formes, notamment -issons avec nous.',boundaryFr:'Ces indices servent à reconnaître les formes montrées. Ils ne prouvent pas que tu sais conjuguer sans aide ni employer tous les temps.',practice:[]},
 {id:'french-v3-teaching:verb-family:other',nodeKey,facetKey:`${nodeKey}::construction:other`,mode:'recognition',status:'draft_requires_review',titleFr:'Repérer un autre modèle de verbe',learnerQuestionFr:'Que changes-tu entre venir, je viens et nous venons ?',steps:[
  {exampleFr:'venir : je viens, nous venons',explanationFr:'La base change : vien dans viens, ven dans venons. Ces formes ne suivent pas le modèle finir, même si venir se termine par -ir.'},
  {exampleFr:'écrire : j’écris, nous écrivons',explanationFr:'Écrire ne suit pas non plus chanter ou finir. Sa famille a ses propres formes à apprendre.'},
  {exampleFr:'chanter : je chante, nous chantons ; finir : je finis, nous finissons',explanationFr:'Commence par comparer avec ces deux modèles. Si les formes ne conviennent à aucun des deux, choisis une autre famille. Cette catégorie contient plusieurs modèles différents.'},
 ],takeawayFr:'Un autre modèle peut changer de base ou de terminaison. Compare plusieurs formes plutôt que la seule fin de l’infinitif.',boundaryFr:'Repérer un autre modèle ne signifie pas que tous ces verbes se conjuguent pareil, ni que tu maîtrises leur conjugaison. Chaque verbe et chaque temps restent à vérifier.',practice:[]},
];
export const VERB_FAMILY_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=lessons.map((lesson,index)=>{
 const family=VERB_FAMILY_RECOGNITION_FACETS[index].value as Family;
 const practice=guided[family].map(([verb,je,nous,answer],i)=>({id:`verb-family-guided:${family}:${i}`,promptFr:`Observe « ${verb} », « ${first(je)} », « nous ${nous} ». À quelle famille ce verbe appartient-il ?`,choices:Object.values(VERB_FAMILY_LABELS),answerFr:VERB_FAMILY_LABELS[answer],hintFr:'Compare l’infinitif et les deux formes avec les modèles proposés.',explanationFr:`${verb} : ${first(je)}, nous ${nous}. ${explanations[answer]}`}));
 return {...lesson,practice,materialExposure:{sentences:[...lesson.steps.flatMap(step=>[step.exampleFr,step.explanationFr]),lesson.takeawayFr,lesson.boundaryFr,...practice.flatMap(exercise=>[exercise.promptFr,...exercise.choices,exercise.hintFr,exercise.explanationFr])]}};
});
