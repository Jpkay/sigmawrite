import type {TargetTeachingContent} from './teaching-content';
type Kind='avoir'|'etre'|'transitivity'|'pronominal';
type Row=readonly [string,string,string];
// The second and third fields are the two present-tense auxiliary forms for
// this subject. Both remain in the guessing model despite a typed response.
const assessment:Record<Kind,readonly Row[]>={
 avoir:[
 ['Tu ___ porté le sac de sport.','as','es'],['Elle ___ couru autour du lac.','a','est'],['Nous ___ nagé dans le bassin.','avons','sommes'],['Vous ___ marché jusqu’au village.','avez','êtes'],['Ils ___ dormi sous la tente.','ont','sont'],['Il ___ téléphoné à son frère.','a','est'],
 ['Tu ___ envoyé la carte postale.','as','es'],['Elles ___ pris le dernier bus.','ont','sont'],['Nous ___ attendu devant le cinéma.','avons','sommes'],['Vous ___ ri pendant le spectacle.','avez','êtes'],['On ___ travaillé sur le projet.','a','est'],['Le gardien ___ fermé la grille.','a','est'],['Les chèvres ___ sauté la barrière.','ont','sont'],['Tu ___ dansé sur la scène.','as','es'],
 ],
 etre:[
 ['Tu ___ arrivé avant le départ.','es','as'],['Elle ___ venue à la répétition.','est','a'],['Nous ___ partis après le déjeuner.','sommes','avons'],['Vous ___ allés au jardin botanique.','êtes','avez'],['Ils ___ tombés pendant la course.','sont','ont'],['La championne ___ née à Dakar.','est','a'],
 ['Tu ___ devenu le capitaine.','es','as'],['Elles ___ restées chez leur cousine.','sont','ont'],['Nous ___ revenus du concert.','sommes','avons'],['Vous ___ entrés par cette porte.','êtes','avez'],['Le cheval ___ mort de vieillesse.','est','a'],['Les secours ___ intervenus rapidement.','sont','ont'],['La cigogne ___ revenue au printemps.','est','a'],['Les graines ___ devenues des plantes.','sont','ont'],
 ],
 transitivity:[
 ['Il ___ sorti les poubelles.','a','est'],['Le chat ___ sorti de la grange.','est','a'],['Il ___ monté les caisses au grenier.','a','est'],['Le visiteur ___ monté au dernier étage.','est','a'],['Tu ___ descendu le carton à la cave.','as','es'],['Le skieur ___ descendu du téléphérique.','est','a'],
 ['Il ___ rentré les chaises du jardin.','a','est'],['Le facteur ___ rentré chez lui.','est','a'],['Il ___ retourné le tapis.','a','est'],['Tu ___ retourné au terrain de basket.','es','as'],['Tu ___ remonté la valise dans la chambre.','as','es'],['Le randonneur ___ remonté au refuge.','est','a'],['Il ___ redescendu la poussette.','a','est'],['Il ___ redescendu de la colline.','est','a'],
 ['Le déménageur ___ sorti le piano.','a','est'],['Le musicien ___ sorti du studio.','est','a'],['Tu ___ monté les marches de la tour.','as','es'],['Tu ___ monté sur le toit.','es','as'],['Le livreur ___ descendu le colis au sous-sol.','a','est'],['Le passager ___ descendu du tramway.','est','a'],
 ['Le jardinier ___ rentré les outils.','a','est'],['Le pêcheur ___ rentré au port.','est','a'],['Tu ___ retourné la feuille.','as','es'],['Le joueur ___ retourné au vestiaire.','est','a'],['Il ___ remonté le seau du puits.','a','est'],['Tu ___ remonté dans le bus.','es','as'],['Tu ___ redescendu le sac du grenier.','as','es'],['Le guide ___ redescendu au camp.','est','a'],
 ],
 pronominal:[
 ['Tu t’___ installé près du radiateur.','es','as'],['Elle s’___ lavé les mains.','est','a'],['Nous nous ___ souvenus de la date.','sommes','avons'],['Vous vous ___ parlé après la réunion.','êtes','avez'],['Ils se ___ dépêchés pour prendre le train.','sont','ont'],['Ma sœur s’___ levée à sept heures.','est','a'],
 ['Tu t’___ brossé les dents.','es','as'],['Elles se ___ rencontrées à la bibliothèque.','sont','ont'],['Nous nous ___ écrit pendant les vacances.','sommes','avons'],['Vous vous ___ trompés de rue.','êtes','avez'],['Le coureur s’___ blessé au genou.','est','a'],['Les voisines se ___ téléphoné hier.','sont','ont'],['La danseuse s’___ entraînée toute la matinée.','est','a'],['Tu t’___ acheté un cahier.','es','as'],
 ],
};
const guided:Record<Kind,readonly Row[]>={
 avoir:[['Tu ___ joué aux échecs.','as','es'],['Nous ___ voyagé en car.','avons','sommes'],['Elle ___ souri sur la photo.','a','est'],['Vous ___ chanté en classe.','avez','êtes']],
 etre:[['Tu ___ parti pour Lyon.','es','as'],['Nous ___ arrivés au musée.','sommes','avons'],['Elle ___ restée au chaud.','est','a'],['Vous ___ devenus amis.','êtes','avez']],
 transitivity:[['Elle ___ descendu les escaliers.','a','est'],['Elle ___ descendue du car.','est','a'],['Nous ___ sorti le vélo du garage.','avons','sommes'],['Nous ___ sortis du théâtre.','sommes','avons']],
 pronominal:[['Tu t’___ réveillé avant moi.','es','as'],['Nous nous ___ posé une question.','sommes','avons'],['Elle s’___ habillée rapidement.','est','a'],['Vous vous ___ souri en arrivant.','êtes','avez']],
};
const models:Record<Kind,{title:string;question:string;steps:TargetTeachingContent['steps'];rule:string;boundary:string}>={
 avoir:{title:'Choisir avoir pour construire le passé composé',question:'Pourquoi écrit-on « elle a couru » et non « elle est couru » ?',steps:[
  {exampleFr:'Elle court. → Elle a couru.',explanationFr:'Courir utilise avoir pour former le passé composé. A, la forme d’avoir qui va avec elle, accompagne couru. Cet auxiliaire est le verbe qui aide à construire le temps composé.'},
  {exampleFr:'nous avons marché\nvous avez nagé',explanationFr:'Marcher et nager utilisent aussi avoir, même s’ils décrivent un déplacement. Le sens de mouvement ne suffit pas pour choisir être.'},
  {exampleFr:'tu as chanté\nelles ont chanté',explanationFr:'Une fois avoir choisi, prends la forme qui correspond au sujet : tu as, elles ont. Le participe chanté est déjà donné dans ces exercices.'},
 ],rule:'Pour ces verbes, choisis avoir, puis sa forme au présent adaptée au sujet.',boundary:'Beaucoup de verbes utilisent avoir, mais certains utilisent être. D’autres changent d’auxiliaire selon leur construction. Ces cas ont leurs propres exercices.'},
 etre:{title:'Choisir être avec arriver, partir et d’autres verbes',question:'Que remarques-tu dans « elle est arrivée » ?',steps:[
  {exampleFr:'Elle arrive. → Elle est arrivée.',explanationFr:'Arriver utilise être au passé composé : est accompagne arrivée. On ne choisit pas avoir pour cette construction.'},
  {exampleFr:'il est parti\nnous sommes venus\nelles sont restées',explanationFr:'Partir, venir et rester utilisent aussi être. Repère le verbe puis la forme d’être qui va avec le sujet : il est, nous sommes, elles sont.'},
  {exampleFr:'elle est née\nil est devenu adulte',explanationFr:'Être ne concerne pas seulement les déplacements. Naître et devenir l’utilisent aussi. Il faut apprendre le fonctionnement du verbe, pas une règle « mouvement = être ».'},
 ],rule:'Avec les verbes de cette famille, emploie être au présent pour former le passé composé.',boundary:'Les participes et leurs accords sont fournis. Choisir l’auxiliaire ne démontre pas encore que tu sais écrire ces accords. Certains autres verbes changent d’auxiliaire selon la construction.'},
 transitivity:{title:'Choisir selon la construction : sortir ou sortir quelque chose',question:'Pourquoi « elle est sortie » mais « elle a sorti son vélo » ?',steps:[
  {exampleFr:'Elle est sortie de la maison.\nElle a sorti son vélo.',explanationFr:'Dans la première phrase, elle sort elle-même. Dans la seconde, elle sort quelque chose : son vélo. Ce groupe répond directement à sortir quoi ; c’est un complément direct. Avec sortir, cette différence fait changer l’auxiliaire.'},
  {exampleFr:'il est monté au grenier\nil a monté une malle',explanationFr:'Monter fonctionne ici de la même façon. Au grenier indique un lieu. Une malle désigne ce qu’il monte : avec ce complément direct, on utilise avoir.'},
  {exampleFr:'elle est descendue de la terrasse\nelle a descendu l’échelle',explanationFr:'Descendre peut aussi se construire des deux façons. Observe la phrase entière, et pas seulement le verbe ou son idée de déplacement.'},
 ],rule:'Pour les verbes étudiés ici, cherche si le verbe possède un complément direct : cela peut faire passer d’être à avoir.',boundary:'Ce changement concerne certains verbes, dont sortir, monter, descendre, rentrer et retourner. Il ne s’applique pas à tous les verbes : courir garde avoir même sans complément direct. Les accords sont déjà fournis.'},
 pronominal:{title:'Choisir être avec un verbe pronominal',question:'Quel petit mot remarques-tu dans « elle s’est préparée » ?',steps:[
  {exampleFr:'Elle prépare son sac.\nElle se prépare. → Elle s’est préparée.',explanationFr:'Dans se prépare, le petit mot se accompagne le verbe et renvoie au même sujet, elle. On appelle cette construction un verbe pronominal. Au passé composé, elle utilise être.'},
  {exampleFr:'tu t’es promené\nnous nous sommes promenés',explanationFr:'Le petit pronom change avec le sujet : tu te, nous nous. Te devient t’ devant es. L’auxiliaire reste être, conjugué avec le sujet.'},
  {exampleFr:'elles se sont parlé\nelle s’est lavé les mains',explanationFr:'Être reste l’auxiliaire même quand le participe ne prend pas la marque du sujet. Choisir être et accorder le participe sont deux décisions différentes.'},
 ],rule:'Avec un verbe pronominal au passé composé, choisis être et conjugue-le avec le sujet.',boundary:'Les accords des verbes pronominaux demandent une analyse supplémentaire. Les exercices donnent le participe correctement écrit et évaluent seulement le choix et la forme de l’auxiliaire.'},
};
export const AUXILIARY_CHOICE_DRAFTS=(Object.keys(assessment) as Kind[]).flatMap(kind=>assessment[kind].map(([sentence,answer,other],index)=>({key:`${kind}-${index+1}`,kind,sentence,answer,other,reason:models[kind].rule})));
export const AUXILIARY_CHOICE_TEACHING:readonly TargetTeachingContent[]=(Object.keys(models) as Kind[]).map(kind=>{
 const model=models[kind];const lesson:TargetTeachingContent={id:`french-v3-teaching:auxiliary-choice:${kind}`,nodeKey:'choisir_auxiliaire_compose',facetKey:`choisir_auxiliaire_compose::construction:${kind}`,mode:'production',status:'draft_requires_review',titleFr:model.title,learnerQuestionFr:model.question,steps:model.steps,takeawayFr:model.rule,boundaryFr:model.boundary,
 practice:guided[kind].map(([sentence,answer],index)=>({id:`auxiliary-choice-${kind}-guided-${index+1}`,promptFr:`${sentence}\n\nComplète au passé composé. Écris seulement l’auxiliaire conjugué ; le participe est déjà correct.`,answerFr:answer,hintFr:model.rule,explanationFr:`${sentence.replace('___',answer)} ${model.rule}`}))};
 return {...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(s=>s.exampleFr.split(/\n| → /)),...guided[kind].flatMap(([sentence,answer])=>[sentence,sentence.replace('___',answer)])]}};
});
