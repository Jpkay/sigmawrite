import type {TargetTeachingContent} from './teaching-content';
const lessons:TargetTeachingContent[]=[
 {
  id:'french-v3-teaching:recognition:imparfait',nodeKey:'reconnaitre_imparfait',mode:'recognition',status:'draft_requires_review',
  titleFr:'Reconnaître l’imparfait',learnerQuestionFr:'Qu’est-ce qui distingue « elle préparait » de « elle prépare » ?',
  steps:[
   {exampleFr:'Elle préparait les costumes. Elle prépare les costumes.',explanationFr:'Préparait est à l’imparfait, un temps souvent utilisé pour raconter une habitude ou décrire une situation passée. Prépare est au présent. Ici, la forme écrite du verbe permet de les distinguer.'},
   {exampleFr:'Je préparais. Tu préparais. Elle préparait. Nous préparions. Vous prépariez. Ils préparaient.',explanationFr:'À l’imparfait, les terminaisons sont -ais, -ais, -ait, -ions, -iez et -aient. Une terminaison est la fin du verbe qui change avec le sujet. Observe notamment le i dans préparions et prépariez.'},
   {exampleFr:'Nous étions dans la cuisine. Vous faisiez la soupe.',explanationFr:'L’imparfait ne concerne pas seulement les verbes en -er. Étaient, étions, faisais ou faisiez sont aussi des formes de l’imparfait. Le début du verbe peut donc être différent de celui des exemples précédents.'},
   {exampleFr:'Je préparais le repas. J’avais préparé le repas.',explanationFr:'Préparais est un verbe à l’imparfait. Dans avais préparé, il faut nommer le groupe entier : c’est le plus-que-parfait, un autre temps du passé. Repérer seulement avais donnerait une réponse incomplète.'},
   {exampleFr:'Nous préparions une fête. Nous préparerions une fête si la salle était libre.',explanationFr:'Préparions est à l’imparfait. Préparerions contient un r supplémentaire avant -ions et est au conditionnel présent, une forme qui exprime ici une possibilité soumise à une condition. Regarde le verbe entier, pas seulement ses dernières lettres.'},
  ],
  takeawayFr:'Pour reconnaître l’imparfait, observe le verbe entier et ses terminaisons. Si plusieurs mots forment le temps, regarde le groupe complet.',
  boundaryFr:'Reconnaître l’imparfait dans une phrase ne prouve pas que tu sais former tous les verbes à ce temps, ni choisir entre les temps du passé dans un récit.',
  practice:[
   {id:'imparfait-guide-1',promptFr:'Quelle phrase contient un verbe à l’imparfait ?',choices:['Tu peignais une fresque.','Tu peins une fresque.','Tu peindras une fresque.','Tu as peint une fresque.'],answerFr:'Tu peignais une fresque.',hintFr:'Observe peignais : la forme finit par -ais.',explanationFr:'Peignais est à l’imparfait. Peins est au présent, peindras au futur simple et as peint au passé composé.'},
   {id:'imparfait-guide-2',promptFr:'Nous marchions le long du canal. À quel temps marchions est-il conjugué ?',choices:['À l’imparfait.','Au présent.','Au futur simple.','Au passé composé.'],answerFr:'À l’imparfait.',hintFr:'Compare marchions et marchons. Quelle forme contient -ions ?',explanationFr:'Marchions contient la terminaison -ions de l’imparfait avec nous. Marchons serait le présent.'},
   {id:'imparfait-guide-3',promptFr:'Quelle forme est à l’imparfait ?',choices:['vous rangiez','vous rangez','vous rangerez','vous avez rangé'],answerFr:'vous rangiez',hintFr:'Cherche la terminaison -iez.',explanationFr:'Rangiez est à l’imparfait avec vous. Rangez est au présent ; le i fait ici la différence.'},
   {id:'imparfait-guide-4',promptFr:'La salle était lumineuse. Quel verbe est à l’imparfait ?',choices:['était','salle','lumineuse','La'],answerFr:'était',hintFr:'Cherche la forme du verbe être.',explanationFr:'Était est le verbe être à l’imparfait avec un sujet que l’on peut remplacer par elle.'},
   {id:'imparfait-guide-5',promptFr:'Ils préparaient le dessert. Ils avaient préparé le dessert. Quelle phrase emploie l’imparfait seul ?',choices:['Ils préparaient le dessert.','Ils avaient préparé le dessert.'],answerFr:'Ils préparaient le dessert.',hintFr:'Dans la seconde phrase, lis avaient et préparé ensemble.',explanationFr:'Préparaient est à l’imparfait. Avaient préparé forme un plus-que-parfait : les deux mots doivent être lus ensemble.'},
   {id:'imparfait-guide-6',promptFr:'Quelle forme est à l’imparfait, et non au conditionnel présent ?',choices:['nous collions','nous collerions'],answerFr:'nous collions',hintFr:'Cherche le r qui apparaît dans une seule des deux formes.',explanationFr:'Collions est l’imparfait de coller. Collerions, avec r avant -ions, est au conditionnel présent.'},
  ],
 },
 {
  id:'french-v3-teaching:recognition:futur_simple',nodeKey:'reconnaitre_futur_simple',mode:'recognition',status:'draft_requires_review',
  titleFr:'Reconnaître le futur simple',learnerQuestionFr:'Pourquoi « elle chantera » et « elle va chanter » ne portent-ils pas le même nom ?',
  steps:[
   {exampleFr:'Elle chantera au spectacle. Elle va chanter au spectacle.',explanationFr:'Les deux phrases annoncent une action. Chantera est au futur simple. Va chanter associe aller au présent et chanter, la forme du dictionnaire appelée infinitif : cette construction s’appelle le futur proche.'},
   {exampleFr:'Je chanterai. Tu chanteras. Il chantera. Nous chanterons. Vous chanterez. Elles chanteront.',explanationFr:'Au futur simple, on retrouve ici chanter- puis les terminaisons -ai, -as, -a, -ons, -ez et -ont. Une terminaison est la fin du verbe qui change avec le sujet.'},
   {exampleFr:'Je serai disponible. Tu auras le temps. Elle fera le trajet.',explanationFr:'Certains débuts de verbes changent : être donne ser-, avoir donne aur- et faire donne fer-. Serai, auras et fera sont pourtant bien des futurs simples. Chercher uniquement le verbe du dictionnaire ne suffit pas.'},
   {exampleFr:'Demain, nous chantons. Demain, nous chanterons.',explanationFr:'Les deux phrases parlent de demain. Chantons reste un présent ; chanterons est au futur simple. Le moment raconté et la forme grammaticale sont deux informations différentes.'},
   {exampleFr:'Je chanterai. Je chanterais si je connaissais la chanson.',explanationFr:'Chanterai, sans s, est au futur simple. Chanterais, avec s, est au conditionnel présent : la seconde phrase pose ici une condition. Lis toute la forme écrite pour les distinguer.'},
  ],
  takeawayFr:'Repère la forme entière du verbe : le futur simple se distingue du présent, du futur proche et du conditionnel, même quand plusieurs phrases parlent de l’avenir.',
  boundaryFr:'Cette leçon apprend à reconnaître le futur simple. Former les verbes, choisir ce temps dans un texte et interpréter toutes ses nuances sont d’autres compétences.',
  practice:[
   {id:'futur-simple-guide-1',promptFr:'Quelle phrase contient un futur simple ?',choices:['Tu répareras le jouet.','Tu répares le jouet.','Tu réparais le jouet.','Tu vas réparer le jouet.'],answerFr:'Tu répareras le jouet.',hintFr:'Cherche la forme réparer- suivie de -as.',explanationFr:'Répareras est au futur simple. Vas réparer est au futur proche, même si les deux phrases annoncent une action.'},
   {id:'futur-simple-guide-2',promptFr:'Nous serons à l’accueil. À quel temps serons est-il conjugué ?',choices:['Au futur simple.','Au présent.','À l’imparfait.','Au passé composé.'],answerFr:'Au futur simple.',hintFr:'Ser- est le début du verbe être au futur simple.',explanationFr:'Serons est être au futur simple avec nous. Le début du verbe a changé par rapport à l’infinitif être.'},
   {id:'futur-simple-guide-3',promptFr:'Quelle phrase emploie le futur simple ?',choices:['Vous aurez les billets.','Vous avez les billets.','Vous aviez les billets.','Vous allez avoir les billets.'],answerFr:'Vous aurez les billets.',hintFr:'Repère aur-, le début d’avoir au futur simple.',explanationFr:'Aurez est au futur simple. Allez avoir est au futur proche.'},
   {id:'futur-simple-guide-4',promptFr:'Demain, ils cuisinent. Demain, ils cuisineront. Quelle forme est au futur simple ?',choices:['cuisineront','cuisinent'],answerFr:'cuisineront',hintFr:'Demain apparaît dans les deux phrases. Compare les verbes.',explanationFr:'Cuisineront est au futur simple. Cuisinent est au présent, employé ici pour une action prévue.'},
   {id:'futur-simple-guide-5',promptFr:'Quelle forme est au futur simple avec je ?',choices:['je rangerai','je rangerais'],answerFr:'je rangerai',hintFr:'Avec je, le futur simple se termine ici par -rai, sans s.',explanationFr:'Rangerai est au futur simple. Rangerais est au conditionnel présent.'},
   {id:'futur-simple-guide-6',promptFr:'Elles feront le trajet à pied. Quel groupe est au futur simple ?',choices:['feront','Elles','le trajet','à pied'],answerFr:'feront',hintFr:'Cherche la forme conjuguée de faire.',explanationFr:'Feront est faire au futur simple avec elles. Le verbe ne conserve pas tout l’infinitif faire.'},
  ],
 },
];
export const SIMPLE_TENSE_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=lessons.map(lesson=>({...lesson,materialExposure:{sentences:[...lesson.steps.map(step=>step.exampleFr),...lesson.practice.flatMap(exercise=>[exercise.promptFr,...(exercise.choices??[])])]}}));
