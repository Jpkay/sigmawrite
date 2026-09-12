import type {TargetTeachingContent} from './teaching-content';
type Practice={before:string;support:string;after:string;word:string;answer:string;others:string[]};
const practice:Record<string,Practice[]>={
 narrative:[
  {before:'Lina arrive devant une vieille maison.',support:'Un porche, espace couvert devant la porte, la protège de la pluie.',after:'Elle attend là que son amie lui ouvre.',word:'porche',answer:'Un espace couvert devant la porte.',others:['Une fenêtre dans le toit.','Un jardin derrière la maison.','Un escalier à l’intérieur.']},
  {before:'Yassine traverse la cour après le spectacle.',support:'Il marche à pas feutrés, des pas légers et presque silencieux.',after:'Il ne veut pas réveiller son petit frère.',word:'feutrés',answer:'Légers et presque silencieux.',others:['Rapides et très bruyants.','Hésitants à cause de la fatigue.','Lourds parce que le sol colle.']},
  {before:'Mila retrouve une boîte au fond du grenier.',support:'Elle l’entrouvre, c’est-à-dire qu’elle l’ouvre seulement un peu.',after:'Elle aperçoit une photographie à l’intérieur.',word:'entrouvre',answer:'Ouvre seulement un peu.',others:['Ferme complètement.','Ouvre en cassant le couvercle.','Retourne sans ouvrir.']},
 ],
 informational:[
  {before:'Le panneau décrit les oiseaux de la réserve.',support:'Une espèce sédentaire reste dans la même région toute l’année.',after:'Les visiteurs peuvent observer les oiseaux depuis un abri.',word:'sédentaire',answer:'Qui reste dans la même région toute l’année.',others:['Qui change de région chaque saison.','Qui vit uniquement près de la mer.','Qui se nourrit seulement la nuit.']},
  {before:'Une notice accompagne le kit de plantation.',support:'Le substrat est la matière dans laquelle les racines poussent.',after:'Il faut l’humidifier avant de placer les graines.',word:'substrat',answer:'La matière dans laquelle les racines poussent.',others:['Le récipient qui contient les graines.','L’outil utilisé pour arroser.','La partie de la plante qui porte les fleurs.']},
  {before:'Le musée présente plusieurs objets décoratifs.',support:'Un objet bicolore possède deux couleurs.',after:'Les visiteurs peuvent dessiner leur objet préféré.',word:'bicolore',answer:'Qui possède deux couleurs.',others:['Qui possède deux formes.','Qui change de couleur au soleil.','Qui ne possède aucune couleur.']},
 ],
 argumentative:[
  {before:'Je propose un calendrier commun pour les clubs.',support:'Évitons les chevauchements, les moments où deux activités ont lieu en même temps.',after:'Chacun pourrait alors participer à davantage d’ateliers.',word:'chevauchements',answer:'Les moments où des activités ont lieu en même temps.',others:['Les moments où aucune activité n’est prévue.','Les déplacements entre deux salles.','Les activités réservées aux adultes.']},
  {before:'Nous pourrions rendre le journal plus facile à lire.',support:'Ajoutons un lexique, une liste de mots accompagnés de leur sens.',after:'Les lecteurs comprendraient mieux les termes spécialisés.',word:'lexique',answer:'Une liste de mots accompagnés de leur sens.',others:['Une liste des personnes abonnées.','Un résumé de tous les articles.','Une image qui remplace un article.']},
  {before:'Je souhaite que notre équipe essaie une nouvelle organisation.',support:'Faisons un bilan, un examen de ce qui a fonctionné et de ce qui a posé problème.',after:'Nous pourrions ensuite modifier les tâches qui restent difficiles.',word:'bilan',answer:'Un examen de ce qui a fonctionné et posé problème.',others:['Une décision prise avant toute expérience.','Une liste des tâches sans aucun commentaire.','Une récompense pour la personne la plus rapide.']},
 ],
};
const intros:Record<string,{title:string;example:string;explanation:string}>={
 narrative:{title:'Comprendre un mot expliqué dans une histoire',example:'Sana est perplexe : elle hésite et ne sait pas quoi penser.',explanation:'Tu ne connais peut-être pas « perplexe ». La suite l’explique : Sana hésite et ne sait pas quoi penser. Tu peux comprendre le mot en t’appuyant sur cette explication.'},
 informational:{title:'Trouver le sens d’un mot expliqué dans un document',example:'La germination est le début du développement d’une graine en plante.',explanation:'Le texte explique directement « germination ». Il s’agit du début du développement d’une graine en plante. Tu n’as pas besoin de connaître ce mot avant de lire.'},
 argumentative:{title:'Comprendre les mots expliqués dans une opinion',example:'Choisissons une solution réversible, que nous pourrons annuler si elle ne convient pas.',explanation:'La personne explique « réversible » : la solution peut être annulée. Tu peux retrouver ce sens sans être d’accord avec sa proposition.'},
};
export const LOCAL_DEFINITION_READING_TEACHING:readonly TargetTeachingContent[]=Object.entries(practice).map(([genre,rows])=>{
 const intro=intros[genre];
 const steps=[
  {exampleFr:intro.example,explanationFr:intro.explanation},
  {exampleFr:'« c’est-à-dire », « autrement dit », « signifie » ou une explication après « : »',explanationFr:'Ces expressions peuvent introduire une définition ou une reformulation. Une définition locale est une explication du mot donnée tout près de lui dans le texte. Relis la phrase du mot et les phrases voisines.'},
  {exampleFr:'Un mot est expliqué par « facile à transporter ». Le choix « impossible à déplacer » dit le contraire.',explanationFr:'Compare chaque réponse à l’explication du texte. Choisis celle qui garde le même sens, puis retrouve les mots du texte qui la justifient. Un détail vrai sur le sujet ne suffit pas s’il n’explique pas le mot.'},
 ];
 return {id:`french-v3-teaching:local-definition-reading:${genre}`,nodeKey:'deduire_mot_definition_locale',facetKey:`deduire_mot_definition_locale::text_type:${genre}`,mode:'interpretation',status:'draft_requires_review',titleFr:intro.title,learnerQuestionFr:'Comment comprendre un mot que le texte explique tout près ?',steps,takeawayFr:'Cherche l’explication proche du mot, compare les sens proposés et montre la phrase qui justifie ton choix.',boundaryFr:'Ici, le texte fournit une explication du mot. Déduire un sens à partir de sa construction, d’un exemple ou d’un contraste demande d’autres indices. Si aucune explication n’est donnée, ne prétends pas en avoir trouvé une.',practice:rows.flatMap((row,index)=>{
  const sentences=[row.before,row.support,row.after],passage=sentences.join(' '),question=`Dans ce texte, que signifie « ${row.word} » ?`;
  return [
   {id:`local-definition-${genre}-${index}-meaning`,promptFr:`${passage}\n\n${question}`,choices:[row.answer,...row.others],answerFr:row.answer,hintFr:'Relis la phrase qui contient le mot. Une partie de cette phrase en explique le sens.',explanationFr:`Le texte indique : « ${row.support} » Le sens à retenir est : ${row.answer}`},
   {id:`local-definition-${genre}-${index}-support`,promptFr:`${passage}\n\nQuelle phrase explique le sens de « ${row.word} » ?`,choices:sentences,answerFr:row.support,hintFr:'Choisis la phrase qui explique le mot, pas seulement celle qui présente le sujet.',explanationFr:`« ${row.support} » contient l’explication. Les deux autres phrases donnent du contexte sans définir ce mot.`},
  ];
 }),materialExposure:{sentences:[...steps.map(step=>step.exampleFr),...rows.map(row=>[row.before,row.support,row.after].join(' '))]}};
});
