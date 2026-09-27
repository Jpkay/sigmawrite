import {conjugate,PERSONS,type Person} from '@/lib/linguistic/conjugation';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
import {conjugationSentenceGap} from './conjugation-sentence';
import type {TargetTeachingContent} from './teaching-content';
/** Habitual or ongoing past situations. Tense choice is supplied, not assessed. */
const contexts:readonly [string,Person,string][]=[
 ['parler','1s','Je ___ souvent avec la gardienne du musée.'],
 ['jouer','2s','Tu ___ aux échecs pendant la pause.'],
 ['donner','3s','Le guide ___ des conseils aux visiteurs.'],
 ['regarder','1p','Nous ___ les bateaux depuis le quai.'],
 ['chanter','2p','Vous ___ dans la chorale du collège.'],
 ['travailler','3p','Les artisans ___ sous un grand auvent.'],
 ['donner','1s','Je ___ de vieux livres à la bibliothèque.'],
 ['parler','2s','Tu ___ doucement pour ne pas réveiller le bébé.'],
 ['jouer','3s','Notre voisin ___ de la guitare chaque soir.'],
 ['chanter','1p','Nous ___ pendant les longs trajets.'],
 ['regarder','2p','Vous ___ les étoiles par la fenêtre.'],
 ['donner','3p','Les entraîneuses ___ une consigne avant chaque jeu.'],
 ['finir','1s','Je ___ mes devoirs avant le dîner.'],
 ['choisir','2s','Tu ___ toujours la place près de la fenêtre.'],
 ['réussir','3s','La nageuse ___ ses départs sans hésiter.'],
 ['finir','1p','Nous ___ chaque réunion par un tour de table.'],
 ['choisir','2p','Vous ___ les morceaux pour la fête.'],
 ['réussir','3p','Les élèves ___ mieux avec un schéma.'],
 ['choisir','1s','Je ___ un roman différent chaque semaine.'],
 ['réussir','2s','Tu ___ tes figures après plusieurs essais.'],
 ['finir','3s','Le cuisinier ___ son service à vingt heures.'],
 ['choisir','1p','Nous ___ ensemble le chemin de randonnée.'],
 ['finir','2p','Vous ___ vos dessins au crayon.'],
 ['réussir','3p','Les musiciennes ___ à jouer sans partition.'],
 ['manger','1s','Je ___ à la cantine tous les jeudis.'],
 ['nager','2s','Tu ___ dans la rivière pendant les vacances.'],
 ['voyager','3s','Ma tante ___ avec une petite valise.'],
 ['manger','1p','Nous ___ à côté du jardin.'],
 ['nager','2p','Vous ___ en suivant la ligne au fond du bassin.'],
 ['voyager','3p','Les journalistes ___ souvent de nuit.'],
 ['voyager','1s','Je ___ en bus pour aller au village.'],
 ['manger','2s','Tu ___ lentement pour savourer le repas.'],
 ['nager','3s','Le chien ___ derrière la barque.'],
 ['voyager','1p','Nous ___ en groupe avec notre club.'],
 ['manger','2p','Vous ___ chez votre grand-mère le dimanche.'],
 ['nager','3p','Les canards ___ entre les roseaux.'],
 ['commencer','1s','Je ___ ma journée par une promenade.'],
 ['lancer','2s','Tu ___ des cailloux plats sur le lac.'],
 ['avancer','3s','La file ___ très lentement.'],
 ['commencer','1p','Nous ___ les répétitions après les cours.'],
 ['lancer','2p','Vous ___ les balles vers le panier.'],
 ['avancer','3p','Les cyclistes ___ malgré le vent.'],
 ['avancer','1s','Je ___ pas à pas dans le brouillard.'],
 ['commencer','2s','Tu ___ chaque lettre par une petite blague.'],
 ['lancer','3s','Le pêcheur ___ sa ligne depuis la digue.'],
 ['avancer','1p','Nous ___ en silence dans la forêt.'],
 ['commencer','2p','Vous ___ le travail quand la cloche sonnait.'],
 ['lancer','3p','Les enfants ___ des boules de neige.'],
];
export const IMPARFAIT_FAMILY_APPLICATIONS=contexts.map(([verb,person,sentence])=>({verb,person,sentence:conjugationSentenceGap(sentence,conjugate(verb,'imparfait',person)),answer:conjugate(verb,'imparfait',person)}));
const subjects:Record<Person,string>={'1s':'je','2s':'tu','3s':'il / elle','1p':'nous','2p':'vous','3p':'ils / elles'};
const endings:Record<Person,string>={'1s':'ais','2s':'ais','3s':'ait','1p':'ions','2p':'iez','3p':'aient'};
function explain(verb:string,person:Person){
 const stem=conjugate(verb,'present','1p').slice(0,-3);
 const correction=verb.endsWith('ger')?(person==='1p'||person==='2p'?'Devant le i, retire le e après g.':'Devant le a, garde le e après g.'):
 verb.endsWith('cer')?(person==='1p'||person==='2p'?'Devant le i, remplace ç par c.':'Devant le a, garde la cédille de ç.'):'';
 return `Pars de nous ${conjugate(verb,'present','1p')} au présent. Retire -ons : ${stem}-. Ajoute -${endings[person]}. ${correction}`.trim();
}
export const IMPARFAIT_FAMILY_TEACHING:readonly TargetTeachingContent[]=CONJUGATION_TEACHING_CASES.filter(d=>d.key.startsWith('pattern:')).map(d=>{
 const verb=d.model,stem=conjugate(verb,'present','1p').slice(0,-3);
 const practice=d.cases.map((row,index)=>{
  const answerFr=conjugate(row.verb,'imparfait',row.person),sentence=conjugationSentenceGap(row.sentence,answerFr);
  return {id:`imparfait:${d.key}:guided-${index}`,promptFr:`Tu racontes une habitude passée. Complète avec ${row.verb} à l’imparfait : ${sentence}`,answerFr,hintFr:explain(row.verb,row.person),explanationFr:`${sentence.replace('___',answerFr)} ${explain(row.verb,row.person)}`};
 });
 const adjustment=d.key==='pattern:spelling_ger'?{exampleFr:'Je mangeais. Nous mangions. Vous mangiez.',explanationFr:'Le g doit garder le même son. Devant le a de -ais, -ait ou -aient, il faut le e : mangeais. Devant le i de -ions ou -iez, ce e est inutile : mangions, mangiez.'}:
 d.key==='pattern:spelling_cer'?{exampleFr:'Je lançais. Nous lancions. Vous lanciez.',explanationFr:'Le c doit garder le son s. Devant le a de -ais, -ait ou -aient, écris ç avec une cédille. Devant le i de -ions ou -iez, c suffit : lancions, lanciez.'}:
 d.key==='pattern:regular_ir'?{exampleFr:'nous finissons → finiss- → je finissais ; nous choisissons → choisiss- → tu choisissais',explanationFr:'Le morceau iss appartient à la base obtenue avec nous au présent. Garde-le à toutes les personnes de l’imparfait pour les verbes de ce modèle.'}:
 {exampleFr:'nous parlons → parl- → je parlais ; nous jouons → jou- → nous jouions',explanationFr:'La base reste entière, même quand elle finit par une voyelle. Ajoute aussi le i de -ions : jouions comporte bien o, u puis i.'};
 const steps:TargetTeachingContent['steps']=[
  {exampleFr:`À cette époque : ${practice[0].explanationFr.split(' Pars de ')[0]}`,explanationFr:'Cette phrase raconte une habitude dans le passé. La forme du verbe permet de situer cette habitude : elle est à l’imparfait.'},
  {exampleFr:`nous ${conjugate(verb,'present','1p')} → ${stem}- → ${conjugate(verb,'imparfait','1s')}`,explanationFr:'Pars de nous au présent et retire -ons. Le morceau conservé s’appelle le radical, la base du verbe. On lui ajoute la fin qui correspond au sujet, appelée terminaison. Certains modèles ajustent aussi une lettre pour garder le même son.'},
  adjustment,
  {exampleFr:PERSONS.map(p=>`${subjects[p]} : ${conjugate(verb,'imparfait',p)}`).join('\n'),explanationFr:'Les terminaisons de l’imparfait sont -ais, -ais, -ait, -ions, -iez et -aient. Même si plusieurs formes se prononcent pareil, leur écriture dépend du sujet.'},
 ];
 return {id:`french-v3-teaching:imparfait:${d.key}`,nodeKey:'produire_imparfait',facetKey:`produire_imparfait::${d.key}`,mode:'production',status:'draft_requires_review',titleFr:`Écrire les verbes comme ${verb} à l’imparfait`,learnerQuestionFr:`Comment raconter une habitude passée avec les verbes comme ${verb} ?`,steps,practice,takeawayFr:`Pars de nous au présent, retire -ons, puis ajoute -ais, -ais, -ait, -ions, -iez ou -aient. ${d.key==='pattern:spelling_ger'?'Garde e devant a, pas devant i.':d.key==='pattern:spelling_cer'?'Écris ç devant a, c devant i.':''}`.trim(),boundaryFr:`Le temps est donné : ces exercices vérifient la forme écrite, pas le choix entre imparfait et passé composé dans un récit. ${d.key==='pattern:regular_ir'?'Les verbes en -ir ne suivent pas tous finir : partir donne nous partons, puis je partais.':'Être a une base particulière, ét-, et se travaille séparément.'}`,materialExposure:{words:[...new Set([verb,...d.cases.map(c=>c.verb),...(d.key==='pattern:regular_ir'?['choisir','partir']:d.key==='pattern:regular_er'?['jouer','être']:['être'])])].map(lemma=>({lemma,form:lemma==='être'?'Être':lemma==='jouer'?'jouions':lemma==='choisir'?'choisissons':lemma})),sentences:[...steps.flatMap(s=>s.exampleFr.split('\n')),...practice.map(p=>p.explanationFr.split(' Pars de ')[0])]}};
});
