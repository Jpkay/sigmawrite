import type {TargetTeachingContent} from './teaching-content';
const labels=['Subjonctif présent','Indicatif présent','Indicatif imparfait','Subjonctif passé'] as const;
type Label=typeof labels[number];
type Example=readonly [sentence:string,form:string,label:Label,reason:string];
export const SUBJONCTIF_RECOGNITION_EXAMPLES:readonly Example[]=[
 ['Il faut que je sois disponible demain.','sois','Subjonctif présent','Sois est une forme simple du subjonctif présent de être.'],
 ['Je souhaite que tu aies une bonne surprise.','aies','Subjonctif présent','Aies est le subjonctif présent de avoir avec tu.'],
 ['La coach veut que Léa fasse le premier essai.','fasse','Subjonctif présent','Fasse est le subjonctif présent de faire.'],
 ['Il est important que nous prenions le bon dossier.','prenions','Subjonctif présent','La construction il est important que appelle ici le subjonctif.'],
 ['Je préfère que vous veniez mardi.','veniez','Subjonctif présent','Après je préfère que, veniez est ici au subjonctif présent.'],
 ['Le groupe attend que les portes s’ouvrent.','ouvrent','Subjonctif présent','Attendre que appelle ici le subjonctif, malgré une forme identique à celle de l’indicatif présent.'],
 ['Il est possible que je puisse aider au montage.','puisse','Subjonctif présent','Puisse est le subjonctif présent de pouvoir.'],
 ['Il vaut mieux que tu saches le numéro de la salle.','saches','Subjonctif présent','Saches est une forme simple du subjonctif présent.'],
 ['Je demande que le bus parte après la visite.','parte','Subjonctif présent','Parte est ici au subjonctif présent après la demande.'],
 ['La guide souhaite que nous voyions les fresques.','voyions','Subjonctif présent','Souhaiter que appelle le subjonctif ; voyions n’est pas ici un imparfait.'],
 ['Il est nécessaire que vous lisiez la consigne entière.','lisiez','Subjonctif présent','Le contexte appelle le subjonctif, même si lisiez peut aussi être une forme de l’imparfait.'],
 ['Le public veut que les artistes reviennent.','reviennent','Subjonctif présent','Reviennent dépend ici de veut que : le mode est le subjonctif.'],
 ['Je sais que le magasin vend des carnets.','vend','Indicatif présent','Savoir que n’impose pas le subjonctif : vend est au présent de l’indicatif.'],
 ['Elle affirme que nous avons les bonnes clés.','avons','Indicatif présent','Avons est à l’indicatif présent ; le subjonctif serait ayons.'],
 ['Je constate que vous êtes dans le bon couloir.','êtes','Indicatif présent','Êtes est à l’indicatif présent ; le subjonctif serait soyez.'],
 ['Le panneau indique que les cars passent ici.','passent','Indicatif présent','Le panneau énonce un fait ; passent est ici au présent de l’indicatif.'],
 ['Je me souviens que nous prenions ce chemin chaque été.','prenions','Indicatif imparfait','Le souvenir porte sur une habitude passée : prenions est ici à l’imparfait.'],
 ['Il racontait que vous veniez souvent autrefois.','veniez','Indicatif imparfait','Autrefois et la répétition situent ici veniez à l’imparfait.'],
 ['Elle se rappelait que nous voyions la mer depuis le balcon.','voyions','Indicatif imparfait','Le souvenir décrit une situation passée : voyions est ici à l’imparfait.'],
 ['Je savais que vous lisiez ce journal tous les matins.','lisiez','Indicatif imparfait','Lisiez décrit ici une habitude passée à l’imparfait.'],
 ['Je suis heureux que tu aies gagné cette course.','aies gagné','Subjonctif passé','Aies suivi du participe gagné forme le subjonctif passé.'],
 ['Il est dommage que nous ayons perdu la carte.','ayons perdu','Subjonctif passé','Le groupe comporte un auxiliaire et un participe passé.'],
 ['Elle regrette que le train soit parti sans nous.','soit parti','Subjonctif passé','Soit parti est une forme composée du subjonctif passé.'],
 ['Je suis ravi que vous soyez venus à cette fête.','soyez venus','Subjonctif passé','Il faut considérer tout le groupe soyez venus, pas seulement soyez.'],
];
const prompt=(sentence:string,form:string)=>`${sentence}\n\nDans cette phrase, à quel mode et à quel temps est « ${form} » ?`;
export const SUBJONCTIF_RECOGNITION_DRAFTS=SUBJONCTIF_RECOGNITION_EXAMPLES.map(([sentence,form,answer,reason],index)=>({key:`subjonctif-recognition-${index+1}`,nodeKey:'reconnaitre_subjonctif_present' as const,prompt:prompt(sentence,form),answer,distractors:labels.filter(l=>l!==answer) as [string,string,string],assessedTexts:[sentence],reason}));
const guided:readonly Example[]=[
 ['Il faut que tu fasses une pause.','fasses','Subjonctif présent','Fasses est le subjonctif présent de faire.'],
 ['Je veux que nous partions ensemble.','partions','Subjonctif présent','Veux que appelle ici le subjonctif.'],
 ['Je sais que nous partions tôt à cette époque.','partions','Indicatif imparfait','À cette époque situe ici une habitude passée.'],
 ['Elle confirme que tu es inscrit.','es','Indicatif présent','Es est au présent de l’indicatif ; sois serait au subjonctif.'],
 ['Il est souhaitable que chacun participe.','participe','Subjonctif présent','Le contexte appelle le subjonctif, même si la forme ressemble à l’indicatif.'],
 ['Je regrette que tu aies oublié ton manteau.','aies oublié','Subjonctif passé','Aies oublié est un groupe composé, au subjonctif passé.'],
];
const steps=[
 {exampleFr:'Tu fais une pause. Il faut que tu fasses une pause.',explanationFr:'Fais devient fasses après il faut que. Cette forme est au subjonctif présent. Ici, la phrase présente ce qui est nécessaire.'},
 {exampleFr:'Je veux que nous partions ensemble. Nous partions tôt à cette époque.',explanationFr:'Partions a la même orthographe dans les deux phrases. Après je veux que, c’est le subjonctif présent. Dans le souvenir d’une habitude passée, c’est l’imparfait de l’indicatif. Lis la phrase entière.'},
 {exampleFr:'Elle confirme que tu es inscrit. Il faut que tu sois inscrit.',explanationFr:'Que apparaît dans les deux phrases. Le verbe es est à l’indicatif, sois au subjonctif. Que seul n’est donc pas un test suffisant.'},
 {exampleFr:'Il faut que tu termines. Je suis contente que tu aies terminé.',explanationFr:'Termines est au subjonctif présent. Aies terminé est au subjonctif passé : il combine l’auxiliaire aies avec le participe terminé. Observe tout le groupe demandé.'},
];
export const SUBJONCTIF_RECOGNITION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:subjonctif:recognition',nodeKey:'reconnaitre_subjonctif_present',mode:'recognition',status:'draft_requires_review',titleFr:'Reconnaître le subjonctif présent dans une phrase',learnerQuestionFr:'Comment distinguer « nous partions » au subjonctif et à l’imparfait ?',steps,
 practice:guided.map(([sentence,form,answer,reason],i)=>({id:`subjonctif-recognition-guided-${i+1}`,promptFr:prompt(sentence,form),choices:[...labels],answerFr:answer,hintFr:'Lis le début de la phrase et observe tout le groupe verbal demandé.',explanationFr:reason})),
 takeawayFr:'Croise la forme du verbe avec le contexte. Que ne suffit pas, et une forme composée comme aies terminé n’est pas un subjonctif présent.',boundaryFr:'Tu identifies ici un mode et un temps dans une phrase déjà écrite. Cela ne prouve pas encore que tu sais choisir ce mode dans ton propre texte ni conjuguer chaque verbe. Le subjonctif présent peut évoquer un événement futur.',materialExposure:{sentences:[...steps.map(s=>s.exampleFr),...guided.map(r=>r[0])]},
}];
