import type {TargetTeachingContent} from './teaching-content';
export type CompletiveCombination={intro:string;content:string};
const row=(intro:string,content:string):CompletiveCombination=>({intro,content});
export const COMPLETIVE_PRODUCTION_ASSESSMENT:readonly CompletiveCombination[]=[
 row('Mila pense','Le musée ferme à dix-huit heures.'),
 row('Le gardien confirme','La porte du jardin est ouverte.'),
 row('Les élèves savent','Le spectacle commence après le repas.'),
 row('Notre voisine affirme','Le colis est arrivé ce matin.'),
 row('Le journal annonce','La piste cyclable sera bientôt prête.'),
 row('Je constate','Les graines ont commencé à pousser.'),
 row('Tu remarques','Le niveau de la rivière monte.'),
 row('Nous découvrons','Le sentier mène à une cascade.'),
 row('La cheffe explique','La pâte doit reposer une heure.'),
 row('Vous croyez','Le match aura lieu dimanche.'),
 row('Le guide précise','La grotte reste fermée en hiver.'),
 row('Les témoins déclarent','Le véhicule roulait lentement.'),
 row('Lina suppose','Il reste une place dans le car.'),
 row('Le médecin indique','Elle peut reprendre le sport.'),
 row('Mon frère raconte','Ils ont aperçu un renard.'),
 row('La responsable vérifie','Elles ont reçu leur invitation.'),
 row('Le professeur assure','On peut résoudre ce problème autrement.'),
 row('Les joueurs pensent','Il faudra changer de stratégie.'),
 row('Le message signale','Une panne retarde le départ.'),
 row('Le bulletin confirme','Un orage approche du village.'),
 row('La capitaine observe','Elle dispose de deux remplaçantes.'),
 row('Le vendeur garantit','Il pourra livrer la commande jeudi.'),
 row('La directrice estime','Elles ont assez de temps pour répéter.'),
 row('Le photographe constate','Ils sont tous dans le cadre.'),
];
export const COMPLETIVE_LINKS=['que','qui','quand','parce que'] as const;
export function completiveSentence(r:CompletiveCombination,link:string='que'){
 const content=r.content[0].toLocaleLowerCase('fr')+r.content.slice(1);
 const elide=(link==='que'||link==='parce que')&&/^[aeiouyàâéèêëîïôöùûüœ]/i.test(content);
 return `${r.intro} ${elide?link.slice(0,-1)+'’':link+' '}${content}`;
}
export function completivePrompt(r:CompletiveCombination){
 return `Écris une seule phrase qui donne le contenu de ce qui est pensé, dit, appris ou constaté. Commence par « ${r.intro} ». Ajoute la proposition ci-dessous en choisissant le lien qui convient : que, qui, quand ou parce que. Garde les autres mots dans leur ordre. Adapte la majuscule et l’apostrophe si nécessaire.\n\n${r.content}`;
}
const guided=[
 row('Nora pense','La boutique est encore ouverte.'),
 row('Le pilote annonce','Le ciel se dégage.'),
 row('Mes amis savent','Nous arriverons avant midi.'),
 row('Le lecteur découvre','Il manque une page au livre.'),
 row('La dessinatrice explique','Elle utilise un crayon très fin.'),
 row('Les voisins confirment','Ils ont retrouvé le chien.'),
];
export const COMPLETIVE_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:completive:production',nodeKey:'construction_subordonnee_completive',mode:'production',status:'draft_requires_review',titleFr:'Écrire ce que quelqu’un pense ou annonce',learnerQuestionFr:'Comment compléter « Nora pense… » avec une phrase entière ?',
 steps:[
  {exampleFr:'Nora pense quelque chose. La boutique est encore ouverte. → Nora pense que la boutique est encore ouverte.',explanationFr:'La deuxième partie dit ce que Nora pense. On la relie au verbe pense avec que. Elle contient son propre sujet, la boutique, et son verbe, est.'},
  {exampleFr:'Nora pense [que la boutique est encore ouverte].',explanationFr:'La partie entre crochets dépend de pense et en complète le sens. On l’appelle une proposition subordonnée complétive. Ici, elle répond à « Nora pense quoi ? ».'},
  {exampleFr:'Le lecteur découvre qu’il manque une page au livre.',explanationFr:'Devant il, que devient qu’ : on remplace son e par une apostrophe. Le sujet il et le verbe manque restent dans la proposition ajoutée.'},
  {exampleFr:'Nora pense que la boutique est ouverte. Nora entre parce que la boutique est ouverte.',explanationFr:'Dans la première phrase, que introduit le contenu de la pensée. Dans la deuxième, parce que donne la raison d’entrer. Ce n’est pas le même lien : choisis selon ce que la phrase doit exprimer.'},
 ],practice:guided.map((r,i)=>({id:`completive-production-guided-${i+1}`,promptFr:completivePrompt(r),answerFr:completiveSentence(r),hintFr:'La proposition ajoutée donne le contenu du verbe introducteur. Choisis que et vérifie si une apostrophe est nécessaire.',explanationFr:`${completiveSentence(r)} La proposition introduite par que ou qu’ complète ici le verbe.`})),
 takeawayFr:'Pour ces verbes, relie le contenu avec que ou qu’. Garde le sujet et le verbe de la proposition ajoutée.',boundaryFr:'Tu construis ici une complétive à partir de mots fournis, après un verbe qui accepte directement que. D’autres constructions emploient à ce que ou de ce que. Cette leçon ne vérifie pas encore le choix du subjonctif ni la rédaction d’un texte autonome.',
 materialExposure:{sentences:[...guided.map(r=>completiveSentence(r)),...guided.map(r=>r.content),'Nora pense quelque chose.','La boutique est encore ouverte.','Nora pense que la boutique est encore ouverte.','Nora pense [que la boutique est encore ouverte].','Le lecteur découvre qu’il manque une page au livre.','Nora entre parce que la boutique est ouverte.']},
}];
