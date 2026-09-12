import {conjugate, PERSONS} from '@/lib/linguistic/conjugation';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';

type Paradigm = {verb:string; forms:string[]; cue:string; complements:string[]};
/** Authored forms and contexts. These drafts do not change a published bundle. */
const paradigms:Paradigm[]=[
 {verb:'être',forms:['sois','sois','soit','soyons','soyez','soient'],cue:'Les formes sont particulières : sois et soit se distinguent par leur dernière lettre. Avec nous et vous, retiens soyons et soyez.',complements:['à l’heure pour le départ','près de la scène','dans la même équipe','ensemble pour cette activité','à l’abri de la pluie','prêts avant le spectacle']},
 {verb:'avoir',forms:['aie','aies','ait','ayons','ayez','aient'],cue:'Avec je, écris aie ; avec tu, aies ; avec il ou elle, ait. Avec nous et vous, retiens ayons et ayez.',complements:['mon carnet avec moi','assez de place pour dessiner','une lampe pour lire','le temps de répéter','un billet pour entrer','leurs chaussures de sport']},
 {verb:'aller',forms:['aille','ailles','aille','allions','alliez','aillent'],cue:'Le début est aill- au singulier et avec ils. Avec nous et vous, il devient all- : allions, alliez.',complements:['à la répétition','au club de dessin','chez le dentiste','à la bibliothèque','au vestiaire','à la rencontre des invités']},
 {verb:'faire',forms:['fasse','fasses','fasse','fassions','fassiez','fassent'],cue:'Garde fass- dans les six formes. Ajoute la fin correspondant au sujet.',complements:['une pause','un essai avec ce pinceau','un dessin pour l’affiche','une répétition générale','attention au câble','un peu de place']},
 {verb:'prendre',forms:['prenne','prennes','prenne','prenions','preniez','prennent'],cue:'Écris prenn- avec je, tu, il et ils. Avec nous et vous, un seul n suffit : prenions, preniez.',complements:['le prochain bus','une feuille blanche','son manteau','le temps de relire','un autre chemin','leurs gourdes']},
 {verb:'venir',forms:['vienne','viennes','vienne','venions','veniez','viennent'],cue:'Écris vienn- avec je, tu, il et ils. Avec nous et vous, pars de ven- : venions, veniez.',complements:['à la réunion du club','avec ton carnet','avant la fermeture','pour aider à ranger','avec une idée de titre','à la dernière répétition']},
 {verb:'partir',forms:['parte','partes','parte','partions','partiez','partent'],cue:'Garde part- dans les six formes. Le t appartient au début conservé du verbe.',complements:['avant la nuit','avec ton équipe','à huit heures','après le goûter','avant le dernier bus','avec leurs accompagnateurs']},
 {verb:'sortir',forms:['sorte','sortes','sorte','sortions','sortiez','sortent'],cue:'Garde sort- dans les six formes, puis ajoute la fin correspondant au sujet.',complements:['mon carnet du sac','les crayons de la boîte','son vélo du garage','les chaises de la salle','vos billets à l’entrée','leurs cahiers pour la lecture']},
 {verb:'dire',forms:['dise','dises','dise','disions','disiez','disent'],cue:'Garde dis- dans les six formes. Le son change par rapport à dire, mais les lettres dis restent.',complements:['mon prénom au groupe','ce que tu préfères','la vérité','ce qui manque','votre réponse à voix haute','leurs idées sans se couper la parole']},
 {verb:'voir',forms:['voie','voies','voie','voyions','voyiez','voient'],cue:'Écris voi- avec je, tu, il et ils. Avec nous et vous, conserve y et ajoute i : voyions, voyiez.',complements:['le tableau depuis ma place','le résultat de ton travail','la fin du film','les détails du dessin','le panneau à l’entrée','la scène depuis le fond']},
 {verb:'pouvoir',forms:['puisse','puisses','puisse','puissions','puissiez','puissent'],cue:'Le début particulier est puiss-. Il reste le même dans les six formes.',complements:['participer au tournoi','écouter le message','ouvrir la porte','répéter dans cette salle','lire les sous-titres','rentrer avec le groupe']},
 {verb:'vouloir',forms:['veuille','veuilles','veuille','voulions','vouliez','veuillent'],cue:'Écris veuill- avec je, tu, il et ils. Avec nous et vous, pars de voul- : voulions, vouliez.',complements:['changer de rôle','essayer un autre instrument','dessiner la couverture','recommencer la partie','proposer un autre titre','rester pour la finale']},
 {verb:'savoir',forms:['sache','saches','sache','sachions','sachiez','sachent'],cue:'Le début particulier est sach-. Il reste le même dans les six formes.',complements:['où retrouver le groupe','comment fixer cette roue','lire le plan','à quelle heure partir','où poser le matériel','qui appeler en cas de problème']},
 {verb:'devoir',forms:['doive','doives','doive','devions','deviez','doivent'],cue:'Écris doiv- avec je, tu, il et ils. Avec nous et vous, pars de dev- : devions, deviez.',complements:['rendre ce livre demain','changer de bus','attendre la prochaine séance','reporter notre sortie','revenir chercher vos affaires','emprunter un autre chemin']},
];
const subjects=['je','tu','il','nous','vous','ils'];
const triggers=['Il est possible que','Il est important que','Il faut que','Il est nécessaire que','Il vaut mieux que','Il est souhaitable que'];

export const SUBJONCTIF_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=paradigms.map(draft=>{
 const {verb,forms}=draft;
 if(forms.length!==6||draft.complements.length!==6)throw Error(`Incomplete subjunctive lesson: ${verb}`);
 forms.forEach((answer,i)=>{if(conjugate(verb,'subjonctif_present',PERSONS[i])!==answer)throw Error(`Subjunctive paradigm disagreement: ${verb}/${PERSONS[i]}`);});
 // Possibility is natural for wanting and owing; do not turn them into redundant obligations.
 const sentences=subjects.map((subject,i)=>{
  const trigger=verb==='vouloir'||verb==='devoir'?'Il est possible que':triggers[i];
  return conjugationSentenceGap(`${trigger} ${subject} ___ ${draft.complements[i]}.`.replace(/que il/g,'qu’il'),forms[i]);
 });
 const complete=(i:number)=>sentences[i].replace('___',forms[i]);
 const steps=[
  {exampleFr:complete(0),explanationFr:`La phrase présente ici une possibilité. Après « il est possible que », on emploie la forme ${forms[0]}. C’est le subjonctif présent du verbe ${verb}.`},
  {exampleFr:`que je : ${forms[0]} ; que tu : ${forms[1]} ; qu’il : ${forms[2]}`,explanationFr:`Le sujet indique de qui on parle. Il détermine la forme écrite du verbe. ${draft.cue}`},
  {exampleFr:`que nous : ${forms[3]} ; que vous : ${forms[4]} ; qu’ils : ${forms[5]}`,explanationFr:verb==='être'||verb==='avoir'?'Ces formes ne suivent pas toutes les terminaisons habituelles du subjonctif. Apprends-les avec leur sujet.':'La fin ajoutée au début du verbe s’appelle la terminaison. Ici, nous prend -ions, vous prend -iez, et ils prend -ent. Le début conservé s’appelle le radical.'},
  {exampleFr:complete(3),explanationFr:'Repère le sujet juste avant le blanc, puis retrouve la forme qui lui correspond. Le mot que ne suffit pas, à lui seul, à imposer le subjonctif dans toutes les phrases. Ici, le début de la phrase appelle ce mode.'},
 ];
 const practice=sentences.map((sentence,i)=>({id:`guided:subjonctif-present:${verb}:${i+1}`,promptFr:`Complète avec ${verb} au subjonctif présent. Écris seulement le verbe : ${sentence}`,answerFr:forms[i],hintFr:`Le sujet est ${subjects[i]}. ${draft.cue}`,explanationFr:`${complete(i)} Avec ${subjects[i]}, la forme du subjonctif présent est ${forms[i]}.`}));
 return {id:`french-v3-teaching:subjonctif-present:${verb}`,nodeKey:'produire_subjonctif_present_frequent',facetKey:`produire_subjonctif_present_frequent::verb:${verb}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire ${verb} au subjonctif présent`,learnerQuestionFr:`Comment écrire ${verb} après « il est possible que » ?`,steps,practice,takeawayFr:`Repère le sujet, puis choisis la forme de ${verb} : ${forms.join(', ')}.`,boundaryFr:'Cette leçon entraîne la forme du verbe dans des phrases où le subjonctif est demandé. Elle ne suffit pas à montrer que tu sais choisir entre indicatif et subjonctif dans un texte. Le subjonctif présent peut aussi parler d’un événement à venir.',materialExposure:{words:[{lemma:verb,form:verb}],sentences:[...steps.map(s=>s.exampleFr),...sentences.map((_,i)=>complete(i))]}};
});
