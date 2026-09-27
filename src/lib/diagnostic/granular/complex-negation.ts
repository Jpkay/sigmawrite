/** Interpret the complete written construction; scope is limited to this sentence. */
export const COMPLEX_NEGATION_MEANINGS={
 plus:'La situation a cessé : ce n’est plus le cas maintenant.',
 jamais:'Cela ne se produit à aucun moment dans la situation décrite.',
 rien:'Aucune chose n’est concernée par l’action décrite.',
 personne:'Aucune personne n’est concernée par l’action décrite.',
 guere:'Cela se produit peu, ou dans une faible mesure, sans être forcément nul.',
 simple:'La phrase contient une négation simple avec ne…pas.',
 restriction:'La phrase limite à un élément : ne…que signifie ici seulement.',
} as const;
export type ComplexNegationFeature=keyof typeof COMPLEX_NEGATION_MEANINGS;
const examples:Record<ComplexNegationFeature,readonly string[]>={
 plus:[
  'Depuis son déménagement, Nora ne prend plus ce bus.',
  'Le vieux réveil ne sonne plus depuis hier.',
  'Nous n’habitons plus près de la gare.',
  'Après cette réparation, la porte ne grince plus.',
  'Tu ne joues plus dans cette équipe cette année.',
  'Les élèves n’utilisent plus ces anciens cahiers.',
  'Depuis le remplacement des rouleaux, l’imprimante ne laisse plus de traces.',
  'Depuis la fin du stage, Amel ne vient plus au centre le mercredi.',
 ],
 jamais:[
  'Pendant ses voyages, Sami ne prend jamais l’avion.',
  'Dans cette boutique, on ne vend jamais de livres abîmés.',
  'Elle n’oublie jamais la clé de son casier.',
  'Nous ne rentrons jamais seuls après cet entraînement.',
  'Durant le tournoi, ce joueur n’a jamais contesté une décision.',
  'Au cours de cette visite, vous n’avez jamais quitté le groupe.',
  'Durant ce voyage, les deux amis n’ont jamais pris le même train.',
  'Dans ce jeu, le gardien ne quitte jamais sa zone.',
 ],
 rien:[
  'Lina n’a rien acheté au marché ce matin.',
  'Je ne trouve rien dans cette boîte.',
  'Nous n’avons rien changé au décor.',
  'Le vent n’a rien cassé dans le jardin.',
  'Tu n’as rien oublié sur la table.',
  'Elle ne veut rien ajouter à son dessin.',
  'Le mécanicien n’a rien remplacé dans ce moteur.',
  'Les enfants n’ont rien laissé dans le vestiaire.',
 ],
 personne:[
  'Amir ne connaît personne dans cette nouvelle classe.',
  'Nous n’avons rencontré personne sur le sentier.',
  'Le gardien ne laisse entrer personne dans cette salle.',
  'Tu n’as invité personne à cette répétition.',
  'Je ne vois personne devant le portail.',
  'Ces élèves n’attendent personne à la sortie.',
  'Vous n’avez prévenu personne de ce changement.',
  'Le guide n’a oublié personne au point de rendez-vous.',
 ],
 guere:[
  'Depuis la rentrée, Malik ne regarde guère la télévision.',
  'Ce petit abri ne protège guère du vent.',
  'Elle n’a guère dormi pendant le trajet.',
  'Cette explication ne m’aide guère à comprendre le plan.',
  'Nous ne parlons guère durant les répétitions.',
  'Vous n’avez guère de place dans ce coffre.',
  'Ce sac vide ne pèse guère.',
  'Cette solution ne change guère notre organisation.',
 ],
 simple:[
  'Le paquet n’est pas arrivé ce matin.',
  'Cette lampe ne fonctionne pas.',
  'Nous ne sommes pas prêts pour le départ.',
 ],
 restriction:[
  'Lila ne garde que les photos nettes.',
  'Cette salle n’accueille que les groupes inscrits.',
  'Nous n’avons que deux places libres.',
 ],
};

export const COMPLEX_NEGATION_DRAFTS=Object.entries(examples).flatMap(([rawFeature,sentences])=>{
 const feature=rawFeature as ComplexNegationFeature;
 return sentences.map((sentence,index)=>({key:`${feature}:${index+1}`,feature,sentence,answer:COMPLEX_NEGATION_MEANINGS[feature],negativeExample:feature==='simple'||feature==='restriction'}));
});

/** Four alternatives, including nearby meanings; do not multiply their probabilities. */
export function complexNegationChoices(feature:ComplexNegationFeature,index:number):string[]{
 const alternatives:Record<ComplexNegationFeature,readonly ComplexNegationFeature[]>={
  plus:['jamais','guere','simple'],jamais:['plus','guere','simple'],rien:['personne','guere','restriction'],personne:['rien','jamais','restriction'],guere:['jamais','rien','plus'],simple:['plus','jamais','restriction'],restriction:['simple','rien','personne'],
 };
 const choices=[COMPLEX_NEGATION_MEANINGS[feature],...alternatives[feature].map(f=>COMPLEX_NEGATION_MEANINGS[f])];
 const offset=index%choices.length;return [...choices.slice(offset),...choices.slice(0,offset)];
}
