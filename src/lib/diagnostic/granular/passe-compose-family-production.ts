import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
const contexts:readonly [string,Person,string][]=[
 ['parler','1s','Je ___ au libraire après la rencontre.'],
 ['jouer','2s','Tu ___ la dernière partie avec Zoé.'],
 ['donner','3s','Le surveillant ___ le signal du départ.'],
 ['regarder','1p','Nous ___ le reportage jusqu’à la fin.'],
 ['chanter','2p','Vous ___ trois chansons pendant la fête.'],
 ['travailler','3p','Les bénévoles ___ toute la matinée.'],
 ['donner','1s','Je ___ mon ancien casque à Léa.'],
 ['parler','2s','Tu ___ de ton projet devant le jury.'],
 ['jouer','3s','Le pianiste ___ un morceau pour nous.'],
 ['chanter','1p','Nous ___ pour remercier notre entraîneuse.'],
 ['regarder','2p','Vous ___ les photos de la cérémonie.'],
 ['donner','3p','Les voisines ___ des graines aux jardiniers.'],
 ['finir','1s','Je ___ le montage de ma vidéo.'],
 ['choisir','2s','Tu ___ une couleur pour le panneau.'],
 ['réussir','3s','Mon frère ___ son examen de conduite.'],
 ['finir','1p','Nous ___ le nettoyage du terrain.'],
 ['choisir','2p','Vous ___ un nom pour votre équipe.'],
 ['réussir','3p','Les grimpeuses ___ à atteindre le sommet.'],
 ['choisir','1s','Je ___ un cadeau pour ma sœur.'],
 ['réussir','2s','Tu ___ la dernière énigme.'],
 ['finir','3s','La classe ___ le rangement du matériel.'],
 ['choisir','1p','Nous ___ les images du journal.'],
 ['finir','2p','Vous ___ la maquette du pont.'],
 ['réussir','3p','Les apprentis ___ leur première recette.'],
 ['manger','1s','Je ___ les biscuits du goûter.'],
 ['nager','2s','Tu ___ deux longueurs sans pause.'],
 ['voyager','3s','La chercheuse ___ pendant douze heures.'],
 ['manger','1p','Nous ___ avant de reprendre la route.'],
 ['nager','2p','Vous ___ jusqu’au ponton.'],
 ['voyager','3p','Les artistes ___ ensemble jusqu’à Nantes.'],
 ['voyager','1s','Je ___ pour la première fois en bateau.'],
 ['manger','2s','Tu ___ une part de tarte aux prunes.'],
 ['nager','3s','La finaliste ___ plus vite que la veille.'],
 ['voyager','1p','Nous ___ en train pendant les vacances.'],
 ['manger','2p','Vous ___ avec vos correspondants.'],
 ['nager','3p','Les sauveteurs ___ jusqu’à la bouée.'],
 ['commencer','1s','Je ___ la lecture du roman de ma cousine.'],
 ['lancer','2s','Tu ___ le ballon au gardien.'],
 ['avancer','3s','Le groupe ___ de cinq kilomètres.'],
 ['commencer','1p','Nous ___ la préparation du spectacle.'],
 ['lancer','2p','Vous ___ les dés pour choisir le départ.'],
 ['avancer','3p','Les camions ___ jusqu’au portail.'],
 ['avancer','1s','Je ___ ma chaise près du bureau.'],
 ['commencer','2s','Tu ___ ton stage lundi dernier.'],
 ['lancer','3s','La joueuse ___ la balle à sa partenaire.'],
 ['avancer','1p','Nous ___ les tables contre le mur.'],
 ['commencer','2p','Vous ___ l’entraînement à neuf heures.'],
 ['lancer','3p','Les bénévoles ___ une collecte de livres.'],
];
export const PASSE_COMPOSE_FAMILY_APPLICATIONS=contexts.map(([verb,person,sentence])=>({verb,person,sentence:conjugationSentenceGap(sentence,conjugate(verb,'passe_compose',person)),answer:conjugate(verb,'passe_compose',person)}));
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il / elle','1p':'nous','2p':'vous','3p':'ils / elles'};
export const PASSE_COMPOSE_FAMILY_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('pattern:')).map(d=>{
 const verb=d.model,ir=d.key==='pattern:regular_ir',participle=conjugate(verb,'passe_compose','1s').split(' ').slice(1).join(' ');
 const practice=d.cases.map((row,index)=>{
  const answerFr=conjugate(row.verb,'passe_compose',row.person),sentence=conjugationSentenceGap(row.sentence,answerFr),pp=answerFr.split(' ').slice(1).join(' ');
  return {id:`passe-compose:${d.key}:guided-${index}`,promptFr:`Complète avec ${row.verb} au passé composé. Écris le groupe verbal manquant : ${sentence}`,answerFr,hintFr:`Avec ${subjects[row.person]}, avoir au présent donne ${conjugate('avoir','present',row.person)}. Ajoute le participe passé de ${row.verb} : ${pp}.`,explanationFr:`${sentence.replace('___',answerFr)} ${conjugate('avoir','present',row.person)} est l’auxiliaire, le verbe qui aide à former ce temps. ${pp} est le participe passé de ${row.verb}.`};
 });
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:practice[0].explanationFr.split(' est l’auxiliaire')[0].split('. ')[0]+'.',explanationFr:'L’action est présentée comme accomplie. Deux mots du groupe verbal travaillent ensemble pour la raconter au passé : un verbe qui aide, appelé auxiliaire, et une forme du verbe qui raconte l’action, appelée participe passé.'},
  {exampleFr:`${verb} → ${participle} ; j’${conjugate('avoir','present','1s')} ${participle}`,explanationFr:`Dans ces phrases, le verbe qui aide est avoir, conjugué au présent. Pour ce modèle, ${ir?'remplace -ir par -i pour former le participe passé':'remplace -er par -é, avec un accent aigu, pour former le participe passé'}.`},
  ...(d.key==='pattern:spelling_ger'?[{exampleFr:'Je mangeais. J’ai mangé. Nous avons mangé.',explanationFr:'Ne transporte pas le e de mangeais dans le participe passé. Manger devient mangé, sans e supplémentaire : le é permet déjà au g de garder le même son.'}]:d.key==='pattern:spelling_cer'?[{exampleFr:'Je lançais. J’ai lancé. Nous avons lancé.',explanationFr:'Devant le é de lancé, le c garde le son s sans cédille. N’écris pas lançé. La cédille de lançais ne se transporte pas dans le participe passé.'}]:[]),
  {exampleFr:PERSONS.map(p=>`${subjects[p]} : ${conjugate(verb,'passe_compose',p)}`).join('\n'),explanationFr:'Le sujet fait changer avoir : ai, as, a, avons, avez, ont. Dans ces phrases sans complément direct placé avant le verbe, le participe passé ne change pas selon le sujet.'},
 ];
 return {id:`french-v3-teaching:passe-compose:${d.key}`,nodeKey:'produire_passe_compose',facetKey:`produire_passe_compose::${d.key}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire les verbes comme ${verb} au passé composé`,learnerQuestionFr:`Comment raconter une action accomplie avec les verbes comme ${verb} ?`,steps,practice,takeawayFr:`Écris avoir au présent avec le sujet, puis le participe passé : ${participle}.`,boundaryFr:`Le temps est donné ici : cette leçon ne vérifie pas le choix entre imparfait et passé composé. Elle traite des phrases avec avoir, sans complément direct placé avant le verbe. L’auxiliaire être, les verbes pronominaux et l’accord avec un complément placé avant demandent d’autres vérifications. ${ir?'Tous les verbes en -ir ne suivent pas finir.':'Tous les verbes en -er ne suivent pas ce modèle : aller se travaille séparément.'}`,materialExposure:{words:[...new Set([verb,'avoir','être',...d.cases.map(c=>c.verb),...(ir?[]:['aller'])])].map(lemma=>({lemma,form:lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...practice.map(p=>p.explanationFr.split('. ')[0]+'.')]}};
});
