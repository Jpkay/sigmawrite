import type {TargetTeachingContent} from './teaching-content';
const forms:readonly [string,string,string,string][]=[
 ['Je visiterais cette île.','Je visiterai cette île.','Je visitais cette île.','J’ai visité cette île.'],
 ['Tu finirais ce puzzle.','Tu finiras ce puzzle.','Tu finissais ce puzzle.','Tu finis ce puzzle.'],
 ['Elle viendrait à la rencontre.','Elle viendra à la rencontre.','Elle venait à la rencontre.','Elle est venue à la rencontre.'],
 ['Nous aurions une place.','Nous aurons une place.','Nous avions une place.','Nous avons une place.'],
 ['Vous seriez les premiers.','Vous serez les premiers.','Vous étiez les premiers.','Vous êtes les premiers.'],
 ['Ils feraient un détour.','Ils feront un détour.','Ils faisaient un détour.','Ils font un détour.'],
 ['Je pourrais porter cette caisse.','Je pourrai porter cette caisse.','Je pouvais porter cette caisse.','J’aurais pu porter cette caisse.'],
 ['Tu saurais trouver la réponse.','Tu sauras trouver la réponse.','Tu savais trouver la réponse.','Tu sais trouver la réponse.'],
 ['On prendrait un raccourci.','On prendra un raccourci.','On prenait un raccourci.','On a pris un raccourci.'],
 ['Nous voudrions un renseignement.','Nous voudrons un renseignement.','Nous voulions un renseignement.','Nous voulons un renseignement.'],
 ['Vous iriez jusqu’au lac.','Vous irez jusqu’au lac.','Vous alliez jusqu’au lac.','Vous allez jusqu’au lac.'],
 ['Elles devraient revenir.','Elles devront revenir.','Elles devaient revenir.','Elles doivent revenir.'],
];
export const CONDITIONNEL_RECOGNITION_DRAFTS=forms.map(([answer,...others],index)=>({key:`conditionnel-form-${index+1}`,nodeKey:'reconnaitre_conditionnel_present' as const,prompt:'Quelle phrase emploie le conditionnel présent ?',answer,distractors:others as [string,string,string],assessedTexts:[answer,...others],reason:'La forme combine la base du futur avec une terminaison de l’imparfait ; les autres réponses montrent des formes concurrentes.'}));
const lesson:TargetTeachingContent={
 id:'french-v3-teaching:conditionnel:recognition',nodeKey:'reconnaitre_conditionnel_present',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître le conditionnel présent',learnerQuestionFr:'Quelle différence vois-tu entre « je marcherai » et « je marcherais » ?',
 steps:[
  {exampleFr:'Je marcherai jusqu’à la gare.\nJe marcherais jusqu’à la gare.',explanationFr:'Marcherai est au futur simple. Marcherais est au conditionnel présent : le s final change la forme. Selon le contexte, le conditionnel peut présenter une possibilité imaginée ou atténuer une demande.'},
  {exampleFr:'marcher- + -ais → marcherais\nnous marcherions ; vous marcheriez',explanationFr:'Le conditionnel présent combine la base du futur simple avec les terminaisons de l’imparfait : -ais, -ais, -ait, -ions, -iez et -aient. La base est le morceau qui reste quand on enlève la terminaison.'},
  {exampleFr:'je serai → je serais\nje ferai → je ferais\nnous aurons → nous aurions',explanationFr:'Certains verbes ont une base différente de leur infinitif : ser-, fer-, aur-. Ils gardent cette base au conditionnel et changent de terminaison.'},
  {exampleFr:'Il disait : « Je rentrerai tôt. »\nIl disait qu’il rentrerait tôt.',explanationFr:'Le conditionnel peut aussi exprimer un événement futur vu depuis un moment passé. Ne te fie pas seulement à un sens de souhait ou de politesse : observe la forme du verbe.'},
 ],
 takeawayFr:'Observe ensemble la base et la terminaison. Le conditionnel présent utilise la base du futur avec -ais, -ais, -ait, -ions, -iez ou -aient.',
 boundaryFr:'Reconnaître ces formes ne suffit pas à choisir le conditionnel dans un texte ni à conjuguer chaque verbe. Le conditionnel passé, comme aurait marché, est une autre forme.',
 practice:[
 {id:'conditionnel-guide-1',promptFr:'Quelle forme est au conditionnel présent ?',choices:['je chanterais','je chanterai','je chantais','j’ai chanté'],answerFr:'je chanterais',hintFr:'Cherche la base chanter- et la terminaison -ais.',explanationFr:'Chanterais combine chanter- et -ais. Chanterai est au futur, chantais à l’imparfait.'},
 {id:'conditionnel-guide-2',promptFr:'Quelle forme est au conditionnel présent ?',choices:['tu attendrais','tu attendras','tu attendais','tu attends'],answerFr:'tu attendrais',hintFr:'La base du futur est attendr-.',explanationFr:'Attendrais garde le r de la base et ajoute -ais.'},
 {id:'conditionnel-guide-3',promptFr:'Quelle forme est au conditionnel présent ?',choices:['elle dirait','elle dira','elle disait','elle dit'],answerFr:'elle dirait',hintFr:'Dire utilise la base dir-.',explanationFr:'Dirait se forme avec dir- et -ait. Disait est à l’imparfait.'},
 {id:'conditionnel-guide-4',promptFr:'Quelle forme est au conditionnel présent ?',choices:['nous sortirions','nous sortirons','nous sortions','nous sortons'],answerFr:'nous sortirions',hintFr:'Garde sortir- et ajoute -ions.',explanationFr:'Sortirions est au conditionnel. Sortions est à l’imparfait.'},
 {id:'conditionnel-guide-5',promptFr:'Quelle forme est au conditionnel présent ?',choices:['vous verriez','vous verrez','vous voyiez','vous voyez'],answerFr:'vous verriez',hintFr:'Voir a la base verr- au futur et au conditionnel.',explanationFr:'Verriez combine verr- et -iez.'},
 {id:'conditionnel-guide-6',promptFr:'Quelle forme est au conditionnel présent ?',choices:['ils partiraient','ils partiront','ils partaient','ils seraient partis'],answerFr:'ils partiraient',hintFr:'Le conditionnel présent s’écrit ici en un mot.',explanationFr:'Partiraient est au conditionnel présent. Seraient partis est au conditionnel passé.'},
 ],
};
export const CONDITIONNEL_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{...lesson,materialExposure:{sentences:[...lesson.steps.map(s=>s.exampleFr),...lesson.practice.flatMap(p=>[p.promptFr,...p.choices!])]}}];
