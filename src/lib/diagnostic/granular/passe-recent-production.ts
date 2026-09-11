import {PASSE_RECENT_ACTION_VERBS,PASSE_RECENT_ACTION_CONTEXTS,recentActionSentence} from './passe-recent-action-contexts';
import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
/** Original contexts for completed actions, with the requested tense supplied. */
const contexts:readonly [string,Person,string][]=[
 ['parler','1s','Je ___ au responsable du club.'],
 ['jouer','2s','Tu ___ ta dernière carte.'],
 ['donner','3s','La documentaliste ___ un conseil à Léa.'],
 ['regarder','1p','Nous ___ le court métrage jusqu’à la fin.'],
 ['chanter','2p','Vous ___ le dernier couplet.'],
 ['travailler','3p','Les élèves ___ pendant une heure sur leur affiche.'],
 ['donner','1s','Je ___ mon ancien vélo à mon cousin.'],
 ['parler','2s','Tu ___ de ton stage devant la classe.'],
 ['jouer','3s','Notre équipe ___ la finale du tournoi.'],
 ['chanter','1p','Nous ___ pour ouvrir la fête.'],
 ['regarder','2p','Vous ___ les photos de la sortie.'],
 ['donner','3p','Les deux guides ___ le signal du départ.'],
 ['finir','1s','Je ___ la dernière page du roman.'],
 ['choisir','2s','Tu ___ un titre pour ton histoire.'],
 ['réussir','3s','La gymnaste ___ son dernier saut.'],
 ['finir','1p','Nous ___ le rangement de la salle.'],
 ['choisir','2p','Vous ___ le morceau du concert.'],
 ['réussir','3p','Les joueurs ___ leur première mission.'],
 ['choisir','1s','Je ___ ma place dans le train.'],
 ['réussir','2s','Tu ___ à ouvrir la boîte.'],
 ['finir','3s','Le dessinateur ___ son portrait.'],
 ['choisir','1p','Nous ___ une date pour la rencontre.'],
 ['réussir','2p','Vous ___ la dernière épreuve.'],
 ['finir','3p','Les bénévoles ___ la distribution des repas.'],
 ['manger','1s','Je ___ la dernière tranche de pain.'],
 ['nager','2s','Tu ___ cent mètres sans t’arrêter.'],
 ['voyager','3s','Mon frère ___ pendant dix heures en car.'],
 ['manger','1p','Nous ___ avec les musiciens.'],
 ['nager','2p','Vous ___ toute la longueur du bassin.'],
 ['voyager','3p','Les chercheuses ___ jusqu’à Dakar.'],
 ['voyager','1s','Je ___ pour la première fois en avion.'],
 ['manger','2s','Tu ___ un bol de riz.'],
 ['nager','3s','La nageuse ___ sa dernière course de la journée.'],
 ['voyager','1p','Nous ___ ensemble pendant une semaine.'],
 ['manger','2p','Vous ___ les fraises du jardin.'],
 ['nager','3p','Les enfants ___ jusqu’au bord.'],
 ['commencer','1s','Je ___ le deuxième exercice.'],
 ['lancer','2s','Tu ___ le dé sur la table.'],
 ['avancer','3s','Le pion rouge ___ de trois cases.'],
 ['commencer','1p','Nous ___ notre enquête sur le quartier.'],
 ['lancer','2p','Vous ___ les balles dans le panier.'],
 ['avancer','3p','Les randonneurs ___ de deux kilomètres.'],
 ['avancer','1s','Je ___ mon vélo jusqu’au portail.'],
 ['commencer','2s','Tu ___ un nouveau carnet de dessins.'],
 ['lancer','3s','La capitaine ___ le ballon à Inès.'],
 ['avancer','1p','Nous ___ la table près de la fenêtre.'],
 ['commencer','2p','Vous ___ la lecture de la consigne.'],
 ['lancer','3p','Les enfants ___ les confettis en l’air.'],
];
export const PASSE_RECENT_APPLICATIONS= [...contexts,...PASSE_RECENT_ACTION_CONTEXTS].map(([verb,person,sentence])=>({verb,person,sentence,answer:conjugate(verb,'passe_recent',person)}));
const labels={'1s':'je','2s':'tu','3s':'il / elle','1p':'nous','2p':'vous','3p':'ils / elles'};
export const PASSE_RECENT_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(model=>model.key.startsWith('pattern:')||PASSE_RECENT_ACTION_VERBS.has(model.model)).map(model=>{
 const family=model.key.startsWith('pattern:');
 const practice=model.cases.map((row,i)=>{
  const answerFr=conjugate(row.verb,'passe_recent',row.person),sentence=conjugationSentenceGap(recentActionSentence(row.sentence),answerFr);
  return {id:`passe-recent:${model.key}:guided-${i}`,promptFr:`Complète avec ${row.verb} au passé récent. Écris le groupe verbal manquant : ${sentence}`,answerFr,hintFr:`Conjugue venir au présent avec le sujet, puis écris de ou d’ et ${row.verb} à l’infinitif.`,explanationFr:`${sentence.replace('___',answerFr)} L’action est présentée comme terminée depuis peu. ${row.verb} reste à l’infinitif.`};
 });
 const first=model.cases[0],answer=conjugate(first.verb,'passe_recent',first.person);
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:conjugationSentenceGap(recentActionSentence(first.sentence),answer).replace('___',answer),explanationFr:`L’action est déjà terminée, mais elle est encore proche du moment où l’on parle. ${answer} utilise venir au présent, suivi de de et d’un infinitif. Cette construction s’appelle le passé récent.`},
  {exampleFr:PERSONS.map(person=>`${labels[person]} : ${conjugate(model.model,'passe_recent',person)}`).join('\n'),explanationFr:'Seul venir change avec le sujet : viens, viens, vient, venons, venez, viennent. Le second verbe garde sa forme du dictionnaire, l’infinitif. Ne le conjugue pas au présent et ne le remplace pas par un participe passé.'},
  ...(model.model==='venir'?[{exampleFr:'Je viens chercher mon sac. Je viens de venir chercher mon sac.',explanationFr:'Dans la première phrase, venir indique le déplacement. Dans la seconde, viens de présente ce déplacement comme tout récent ; le second venir reste à l’infinitif. Les deux verbes ont ici des rôles différents.'}]:[]),
  {exampleFr:'Nous venons de finir. Nous venons d’avancer.',explanationFr:'De devient d’ devant un infinitif qui commence par une voyelle. La préposition reste nécessaire : venons finir ne signifie pas la même chose que venons de finir.'},
 ];
 return {id:`french-v3-teaching:passe-recent:production:${model.key}`,nodeKey:'produire_passe_recent',facetKey:`produire_passe_recent::${model.key}`,mode:'production',status:'draft_requires_review',titleFr:family?`Écrire les verbes comme ${model.model} au passé récent`:`Écrire ${model.model} au passé récent`,learnerQuestionFr:'Comment dire qu’une action vient de se terminer ?',steps,practice,takeawayFr:'Écris venir au présent avec le sujet, puis de ou d’, puis le verbe à l’infinitif.',boundaryFr:'Le temps est donné ici. Ces exercices ne vérifient pas encore ton choix entre passé récent et passé composé dans un texte. Venir peut aussi indiquer un déplacement : je viens au club n’est pas un passé récent.',materialExposure:{words:[...new Set(['venir',model.model,'finir','avancer',...model.cases.map(row=>row.verb)])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(step=>step.exampleFr.split('\n')),...practice.map(p=>p.explanationFr.split(' L’action')[0])]}};
});
