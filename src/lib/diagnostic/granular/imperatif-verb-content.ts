import {conjugate,type Person} from '@/lib/linguistic/conjugation';
import type {TargetTeachingContent} from './teaching-content';
type ImperativePerson=Extract<Person,'2s'|'1p'|'2p'>;
const persons:ImperativePerson[]=['2s','1p','2p'];
const audiences=['Tu t’adresses à une personne que tu tutoies.','Tu proposes une action à faire ensemble, toi compris.','Tu t’adresses à plusieurs personnes.'];
type VerbContent={verb:string;forms:[string,string,string];hook:string;rule:string;boundary:string;guided:string[];checks:string[]};
/** Authored answers and sentences. These remain drafts pending educator review. */
export const IMPERATIF_VERB_CONTENT:VerbContent[]=[
 {verb:'être',forms:['sois','soyons','soyez'],hook:'Sois attentif au signal. Soyons prêts à partir. Soyez à l’heure.',
 rule:'Pour être, apprends trois formes particulières : sois, soyons, soyez. On ne transforme pas tu es en une consigne en retirant simplement tu.',
 boundary:'Sois garde un s final. Soyons et soyez contiennent un y. Ne les confonds pas avec les formes du présent : es, sommes, êtes.',
 guided:['___ prudent près de la route.','___ à la bibliothèque à midi.','___ attentifs aux autres équipes.','___ honnêtes sur notre résultat.','___ patients pendant la distribution.','___ prêts quand la musique commence.'],
 checks:['___ discret pendant la projection.','___ fier de ton effort.','___ près du portail à seize heures.','___ gentil avec le nouveau joueur.','___ solidaires après cette défaite.','___ précis dans notre explication.','___ au point de rendez-vous avant la nuit.','___ responsables du matériel prêté.','___ silencieux pendant cet enregistrement.','___ présents pour la photo de groupe.','___ attentifs aux indications du guide.','___ vigilants en traversant ce parking.']},
 {verb:'avoir',forms:['aie','ayons','ayez'],hook:'Aie confiance en toi. Ayons un plan. Ayez votre billet à portée de main.',
 rule:'Pour avoir, les formes de la consigne sont aie, ayons, ayez. Aie s’écrit sans s. Le y apparaît dans ayons et ayez.',
 boundary:'N’écris pas ais pour une personne tutoyée. Ces formes se distinguent de as, avons, avez. On donne ici un conseil ou une consigne avec le verbe avoir.',
 guided:['___ confiance dans ton choix.','___ ton carnet avec toi.','___ le courage de poser une question.','___ une pensée pour nos amis absents.','___ vos cartes en main.','___ confiance dans votre équipe.'],
 checks:['___ ton badge à portée de main.','___ un peu de patience avec ce puzzle.','___ le réflexe de relire ta réponse.','___ confiance en tes capacités.','___ une solution de secours pour notre sortie.','___ de la patience pour expliquer notre démarche.','___ une pensée pour ceux qui nous ont aidés.','___ le courage de reconnaître notre erreur.','___ vos autorisations avec vous.','___ le souci de rendre la salle propre.','___ vos numéros de réservation à portée de main.','___ la gentillesse de patienter quelques instants.']},
 {verb:'aller',forms:['va','allons','allez'],hook:'Va vers la porte. Allons à la bibliothèque. Allez au fond du couloir.',
 rule:'Pour aller, choisis va pour une personne tutoyée, allons pour nous et allez pour vous. Dans ces phrases, va n’a pas de s, alors que tu vas en a un.',
 boundary:'Devant le pronom y directement attaché, on écrit vas-y avec un s. Ce cas se travaille séparément. Ne copie pas la forme ils vont pour une consigne.',
 guided:['___ chercher ton manteau.','___ près de la fenêtre.','___ ensemble au terrain de sport.','___ voir notre exposition.','___ dans la cour après la sonnerie.','___ retrouver vos partenaires.'],
 checks:['___ au bureau des objets trouvés.','___ chercher une règle dans le tiroir.','___ lire les horaires près de l’entrée.','___ demander conseil à la bibliothécaire.','___ découvrir le nouveau sentier.','___ chercher notre commande.','___ accueillir les visiteurs à la gare.','___ regarder les étoiles depuis la terrasse.','___ au deuxième étage pour votre atelier.','___ consulter le tableau des équipes.','___ vous asseoir près de la scène.','___ déposer vos sacs au vestiaire.']},
 {verb:'faire',forms:['fais','faisons','faites'],hook:'Fais un essai. Faisons une pause. Faites un cercle.',
 rule:'Pour faire, garde le s de fais. Pour nous, écris faisons. Pour vous, la forme est faites, jamais faisez.',
 boundary:'Fait avec un t correspond à il fait, pas à la consigne adressée à une personne tutoyée. La forme faites peut aussi s’adresser poliment à une seule personne.',
 guided:['___ une copie de ton dessin.','___ attention au rebord.','___ une place à notre invité.','___ un essai avant le spectacle.','___ un pas en arrière.','___ vos calculs sur le brouillon.'],
 checks:['___ une liste de tes affaires.','___ le tour du jardin avant de rentrer.','___ une marque au crayon sur ce repère.','___ signe quand tu es prêt.','___ un bilan de notre projet.','___ une pause à l’ombre du grand arbre.','___ le trajet ensemble demain.','___ attention au temps qui nous reste.','___ une ligne derrière le panneau.','___ vos recherches dans plusieurs livres.','___ circuler cette feuille entre vous.','___ un dessin pour expliquer votre idée.']},
 {verb:'prendre',forms:['prends','prenons','prenez'],hook:'Prends ton sac. Prenons le bus. Prenez vos places.',
 rule:'Pour une personne tutoyée, prends garde un d et un s. Avec nous et vous, le d disparaît : prenons, prenez. N’ajoute pas deux n comme dans ils prennent.',
 boundary:'Il prend se termine par d, tandis que la consigne prends ajoute un s. La forme de nous est prenons, pas prennons.',
 guided:['___ ton crayon bleu.','___ une veste pour ce soir.','___ le temps de relire notre texte.','___ une décision ensemble.','___ vos cahiers de français.','___ place autour de la table.'],
 checks:['___ le chemin qui longe la rivière.','___ une feuille dans cette pile.','___ ton goûter avant de sortir.','___ rendez-vous avec le responsable.','___ le train de neuf heures.','___ une photo de notre maquette.','___ des notes pendant cette visite.','___ soin du matériel commun.','___ les escaliers à droite.','___ vos affaires sous les bancs.','___ chacun une carte du jeu.','___ le temps de comparer vos réponses.']},
 {verb:'venir',forms:['viens','venons','venez'],hook:'Viens près de moi. Venons en aide à nos amis. Venez découvrir notre spectacle.',
 rule:'Pour une personne tutoyée, écris viens avec ien et un s final. Pour nous et vous, le début devient ven : venons, venez.',
 boundary:'Ne copie pas il vient : le t devient s quand tu donnes la consigne viens. Venons et venez n’ont pas deux n.',
 guided:['___ voir mon dessin.','___ à la réunion demain.','___ soutenir notre équipe samedi.','___ en aide à notre voisin.','___ près du tableau.','___ écouter cette histoire.'],
 checks:['___ chercher ton billet au guichet.','___ nous rejoindre après le repas.','___ à la bibliothèque avec ton carnet.','___ essayer ce nouvel instrument.','___ accueillir nos correspondants à la gare.','___ encourager nos amis pendant le tournoi.','___ découvrir cette exposition dimanche.','___ discuter de notre projet avec le professeur.','___ récupérer vos vélos dans la cour.','___ présenter vos idées au groupe.','___ visiter notre stand à la récréation.','___ vous asseoir sur ces coussins.']},
 {verb:'partir',forms:['pars','partons','partez'],hook:'Pars avant la nuit. Partons ensemble. Partez par la porte de droite.',
 rule:'Pour une personne tutoyée, pars perd le t de partir et garde un s. Le t revient dans partons et partez.',
 boundary:'Partir ne suit pas le modèle finir : on écrit partons et partez, pas partissons et partissez. Il part n’est pas la forme de la consigne pars.',
 guided:['___ quand le feu devient vert.','___ avec ton équipe.','___ avant la pluie.','___ à pied jusqu’au musée.','___ après le signal.','___ en petits groupes.'],
 checks:['___ dix minutes plus tôt demain.','___ par le passage couvert.','___ chercher de l’aide à l’accueil.','___ avec une gourde bien remplie.','___ dès que nos sacs sont prêts.','___ ensemble pour cette randonnée.','___ avant que la rue soit trop encombrée.','___ du point indiqué sur notre carte.','___ en laissant la salle propre.','___ chacun avec votre accompagnateur.','___ par la sortie près du parking.','___ assez tôt pour arriver à l’heure.']},
 {verb:'sortir',forms:['sors','sortons','sortez'],hook:'Sors ton carnet. Sortons dans la cour. Sortez vos crayons.',
 rule:'Pour une personne tutoyée, sors s’écrit sans t et avec un s final. Avec nous et vous, garde le t : sortons, sortez.',
 boundary:'Sortir ne suit pas finir. N’écris pas sortissons. Le verbe peut signifier aller dehors ou retirer un objet : la personne à qui tu parles détermine la forme dans les deux cas.',
 guided:['___ ton livre du sac.','___ dans le jardin.','___ notre matériel de dessin.','___ prendre un peu l’air.','___ vos ardoises.','___ calmement de la salle.'],
 checks:['___ la boîte du placard.','___ par cette porte latérale.','___ ton billet pour le contrôle.','___ le gâteau du réfrigérateur.','___ les chaises sur la terrasse.','___ observer les nuages quelques minutes.','___ notre plan pour trouver le chemin.','___ les livres de ce carton.','___ vos calculatrices pour cet exercice.','___ du bassin au coup de sifflet.','___ les cartes de leurs enveloppes.','___ vos chaussures de marche du coffre.']},
 {verb:'dire',forms:['dis','disons','dites'],hook:'Dis ce que tu penses. Disons la vérité. Dites votre prénom.',
 rule:'Pour une personne tutoyée, dis garde un s. Avec nous, écris disons. Avec vous, la forme particulière est dites, pas disez.',
 boundary:'Il dit se termine par t, mais la consigne dis se termine par s. Dites peut s’adresser à plusieurs personnes ou à une seule personne que l’on vouvoie.',
 guided:['___ ton prénom au groupe.','___ merci à ton voisin.','___ ce que nous avons compris.','___ bonjour à notre invité.','___ vos réponses à voix haute.','___ ce qui vous a surpris.'],
 checks:['___ quelle couleur tu préfères.','___ à Lina où se trouve le gymnase.','___ ce dont tu as besoin pour finir.','___ la dernière phrase plus lentement.','___ au guide que nous sommes prêts.','___ ensemble le refrain de ce poème.','___ clairement pourquoi nous avons choisi ce sujet.','___ merci aux personnes qui nous ont aidés.','___ vos noms au responsable de l’atelier.','___ ce que vous remarquez sur cette image.','___ à vos partenaires quelle tâche vous choisissez.','___ la première réplique chacun votre tour.']},
 {verb:'voir',forms:['vois','voyons','voyez'],hook:'Vois avec ton professeur. Voyons ce qui a changé. Voyez le plan affiché.',
 rule:'Pour une personne tutoyée, écris vois avec oi et un s. Avec nous et vous, i devient y : voyons, voyez.',
 boundary:'Ne copie pas il voit : la consigne vois a un s final. Voyons et voyez peuvent inviter à examiner quelque chose, sans demander un déplacement.',
 guided:['___ avec Lina pour le rendez-vous.','___ le responsable à l’accueil.','___ comment résoudre ce problème.','___ ce que montre cette photo.','___ les exemples dans la marge.','___ avec votre groupe pour le matériel.'],
 checks:['___ avec ton partenaire qui commence.','___ le professeur après la séance.','___ si ton nom figure sur la liste.','___ ce que tu peux ajouter à ton affiche.','___ ensemble ce qui manque à notre maquette.','___ comment partager les tâches équitablement.','___ si notre hypothèse explique le résultat.','___ ce que nous pouvons améliorer avant demain.','___ le schéma au dos de votre feuille.','___ avec le bibliothécaire pour prolonger vos prêts.','___ si vos réponses correspondent aux indices.','___ les horaires indiqués près de la porte.']},
];
function rows(content:VerbContent,gaps:string[]){
 if(gaps.length%3)throw Error('Unbalanced imperative persons');
 return gaps.map((sentence,i)=>{const personIndex=Math.floor(i/(gaps.length/3));const person=persons[personIndex],answer=content.forms[personIndex];
  if(conjugate(content.verb,'imperatif_present',person)!==answer)throw Error('Authored imperative disagrees with conjugator');
  return {verb:content.verb,person,sentence,answer,audience:audiences[personIndex]};
 });
}
export const IMPERATIF_VERB_APPLICATIONS=IMPERATIF_VERB_CONTENT.flatMap(c=>rows(c,c.checks));
export const IMPERATIF_VERB_TEACHING:readonly TargetTeachingContent[]=IMPERATIF_VERB_CONTENT.map(c=>{
 const examples=rows(c,c.guided);
 const steps=[
  {exampleFr:c.hook,explanationFr:'Tu veux donner un conseil, demander une action ou proposer de faire quelque chose ensemble. Tu peux commencer par le verbe, sans écrire tu, nous ou vous. Cette forme s’appelle l’impératif présent.'},
  {exampleFr:`Une personne tutoyée : ${c.forms[0]}\nNous, ensemble : ${c.forms[1]}\nPlusieurs personnes : ${c.forms[2]}`,explanationFr:'Repère à qui tu parles avant de choisir la forme. Nous inclut la personne qui parle. Vous peut aussi désigner une seule personne que l’on vouvoie.'},
  {exampleFr:c.hook,explanationFr:c.rule},
 ];
 return {id:`french-v3-teaching:imperatif-present:verb:${c.verb}`,nodeKey:'produire_imperatif',facetKey:`produire_imperatif::verb:${c.verb}`,mode:'production',status:'draft_requires_review',titleFr:`Donner une consigne avec ${c.verb}`,learnerQuestionFr:`Comment écrire ${c.verb} quand je donne un conseil ou une consigne ?`,steps,
  practice:examples.map((r,i)=>({id:`imperatif-verb:${c.verb}:${i+1}`,promptFr:`${r.audience} Complète avec ${c.verb} à l’impératif présent. Écris seulement le verbe : ${r.sentence}`,answerFr:r.answer,hintFr:`Repère à qui tu parles. ${c.rule}`,explanationFr:`${r.sentence.replace('___',r.answer[0].toLocaleUpperCase('fr')+r.answer.slice(1))} ${r.audience} La forme attendue est ${r.answer}.`})),
  takeawayFr:`Repère à qui tu parles, puis choisis ${c.forms.join(', ')}. N’écris pas le pronom sujet.`,boundaryFr:`${c.boundary} Tu travailles ici la forme demandée, pas le choix du mode dans un texte.`,
  materialExposure:{words:[{lemma:c.verb,form:c.verb}],sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...examples.map(r=>r.sentence.replace('___',r.answer[0].toLocaleUpperCase('fr')+r.answer.slice(1)))]},
 };
});
