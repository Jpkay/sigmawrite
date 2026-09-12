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
