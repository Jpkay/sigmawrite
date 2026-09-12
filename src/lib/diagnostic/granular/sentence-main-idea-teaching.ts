import type {TargetTeachingContent} from './teaching-content';
type Guide={text:string;answer:string;detail:string;wrong:readonly [string,string]};
const guides:Record<'narrative'|'informational'|'argumentative',readonly Guide[]>={
 narrative:[
  {text:'Même si la neige couvre le chemin, Lila avance vers la cabane où son frère l’attend.',answer:'Lila poursuit son chemin pour retrouver son frère malgré la neige.',detail:'La neige couvre le chemin.',wrong:['Lila renonce à rejoindre son frère.','Le frère de Lila vient la chercher.']},
  {text:'La photo que Karim retrouve au fond d’une boîte lui rappelle le jardin où il jouait autrefois.',answer:'Une photo retrouvée fait revenir un souvenir d’enfance à Karim.',detail:'La photo était au fond d’une boîte.',wrong:['Karim photographie le jardin pendant qu’il joue.','Karim ne reconnaît rien sur la photo.']},
  {text:'Comme sa voisine ne peut pas porter le panier, Zoé le prend et l’accompagne jusqu’à son immeuble.',answer:'Zoé aide sa voisine à rapporter son panier chez elle.',detail:'La voisine habite dans un immeuble.',wrong:['Zoé laisse sa voisine porter seule le panier.','Zoé achète le panier de sa voisine.']},
 ],
 informational:[
  {text:'Les visiteurs de ce jardin doivent rester sur les chemins balisés, même lorsque les pelouses semblent faciles à traverser.',answer:'Les visiteurs doivent suivre les chemins plutôt que traverser les pelouses.',detail:'Les pelouses peuvent sembler faciles à traverser.',wrong:['Les visiteurs peuvent quitter les chemins quand ils le souhaitent.','Ce jardin est fermé aux visiteurs.']},
  {text:'Si un match est annulé à cause du mauvais temps, les billets restent valables pour la nouvelle date annoncée.',answer:'Les billets restent utilisables à la date de remplacement d’un match annulé pour mauvais temps.',detail:'Le mauvais temps peut entraîner une annulation.',wrong:['Les billets ne servent plus après une annulation.','Les billets permettent d’assister à tous les matchs suivants.']},
  {text:'Le guichet réservé aux groupes ouvre avant les autres afin que les classes puissent retirer leurs billets sans attendre l’ouverture générale.',answer:'Les groupes disposent d’une ouverture anticipée pour retirer leurs billets.',detail:'Un guichet est réservé aux groupes.',wrong:['Les classes doivent attendre la fermeture générale.','Tous les guichets ouvrent à la même heure.']},
 ],
 argumentative:[
  {text:'Même si cela prend du temps, organisons une rencontre entre les clubs afin que leurs membres puissent préparer des projets communs.',answer:'Le texte propose une rencontre entre clubs pour favoriser des projets communs.',detail:'Organiser une rencontre prend du temps.',wrong:['Le texte refuse toute rencontre entre clubs.','Le texte affirme que tous les projets sont déjà terminés.']},
  {text:'Nous devrions prêter des parapluies à l’entrée du centre, puisque certains visiteurs repartent sous la pluie sans pouvoir s’abriter.',answer:'Le texte recommande un prêt de parapluies pour aider les visiteurs qui repartent sous la pluie.',detail:'Certains visiteurs repartent sous la pluie.',wrong:['Le texte propose de fermer le centre quand il pleut.','Le texte demande à chaque visiteur d’acheter un parapluie.']},
  {text:'Gardons un temps de discussion après le film pour entendre les avis différents, sans obliger chaque spectateur à prendre la parole.',answer:'Le texte propose une discussion où chacun reste libre de parler.',detail:'Les spectateurs peuvent avoir des avis différents.',wrong:['Le texte exige que chaque spectateur prenne la parole.','Le texte propose de supprimer les discussions après les films.']},
 ],
};
const labels={narrative:'un récit',informational:'une information ou une consigne',argumentative:'une proposition défendue'};
export const SENTENCE_MAIN_IDEA_TEACHING:readonly TargetTeachingContent[]=Object.entries(guides).map(([rawGenre,rows])=>{
 const genre=rawGenre as keyof typeof guides,first=rows[0];
 const steps=[
  {exampleFr:first.text,explanationFr:`Demande-toi ce que cette phrase veut surtout raconter ou faire comprendre. Ici : ${first.answer} Ce message essentiel est l’idée centrale. La forme du texte est ici ${labels[genre]}.`},
  {exampleFr:first.detail,explanationFr:'Cette information apparaît dans le texte, mais elle n’en conserve qu’une partie. Une réponse peut être vraie tout en restant un simple détail. Compare-la au message de toute la phrase.'},
  {exampleFr:rows[2].text,explanationFr:`Une bonne reformulation change les mots sans changer le message : ${rows[2].answer} Garde une condition, une opposition ou une négation lorsqu’elle est nécessaire au sens.`},
 ];
 return {id:`french-v3-teaching:sentence-main-idea:${genre}`,nodeKey:'identifier_idee_phrase',facetKey:`identifier_idee_phrase::text_type:${genre}`,mode:'interpretation',status:'draft_requires_review',titleFr:`Trouver l’idée centrale dans ${labels[genre]}`,learnerQuestionFr:'Si je devais redire cette phrase, quel message devrais-je garder ?',steps,
 practice:rows.flatMap((row,i)=>[
  {id:`main-idea:${genre}:${i}:message`,promptFr:`${row.text}\n\nQuelle réponse garde le message central ?`,choices:[row.answer,row.detail,...row.wrong],answerFr:row.answer,hintFr:'Cherche ce qui arrive, ce qui est demandé ou ce qui est proposé. Vérifie ensuite les conditions et les négations.',explanationFr:`${row.answer} « ${row.detail} » est vrai, mais ne conserve qu’un détail. Les deux autres réponses changent le sens ou ajoutent une information.`},
  {id:`main-idea:${genre}:${i}:detail`,promptFr:`${row.text}\n\nQuelle réponse ne donne qu’un détail vrai, sans garder le message central ?`,choices:[row.answer,row.detail,...row.wrong],answerFr:row.detail,hintFr:'Une partie de la phrase peut être vraie sans suffire à raconter ou expliquer l’essentiel.',explanationFr:`« ${row.detail} » ne suffit pas à résumer le message. Pour le conserver, on peut dire : ${row.answer}`},
 ]),takeawayFr:'Repère le message de la phrase entière. Choisis une reformulation qui conserve son sens, sans garder seulement un détail ni ajouter une idée inventée.',boundaryFr:'La réponse la plus courte n’est pas forcément la meilleure. Une condition ou une négation peut être essentielle. Repérer l’idée d’une phrase ne suffit pas à résumer tout un paragraphe ni à prouver qu’une affirmation est vraie.',materialExposure:{sentences:[...new Set([...steps.map(s=>s.exampleFr),...rows.map(r=>r.text)])]}};
});
