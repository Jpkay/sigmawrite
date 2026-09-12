import {conjugate, type Person} from '@/lib/linguistic/conjugation';
import {conjugationSentenceGap} from './conjugation-sentence';

/** Fresh applications. The requested mode is supplied; these assess verb forms. */
const contexts: readonly [string, Person, string][] = [
 ['parler','1s','Il faut que je ___ moins vite pour cet enregistrement.'],
 ['chercher','2s','Je souhaite que tu ___ la clé dans le tiroir.'],
 ['regarder','3s','Il faut que Lina ___ des deux côtés avant de traverser.'],
 ['jouer','1p','Le règlement exige que nous ___ chacun notre tour.'],
 ['porter','2p','Il faut que vous ___ un casque sur ce chantier.'],
 ['rester','3p','Je préfère que les fenêtres ___ fermées pendant l’orage.'],
 ['préparer','1s','Tu souhaites que je ___ la salle pour la réunion.'],
 ['dessiner','2s','Je voudrais que tu ___ le trajet sur cette carte.'],
 ['raconter','3s','Nous souhaitons que Sami ___ la fin de son voyage.'],
 ['travailler','1p','Il faut que nous ___ ensemble sur cette affiche.'],
 ['écouter','2p','Je souhaite que vous ___ ce court message.'],
 ['aider','3p','Il faut que les bénévoles ___ les visiteurs à trouver leur place.'],
 ['finir','1s','Il faut que je ___ cette maquette avant vendredi.'],
 ['choisir','2s','Je préfère que tu ___ une autre couleur pour le titre.'],
 ['réussir','3s','Nous souhaitons que cette équipe ___ son premier essai.'],
 ['remplir','1p','Il faut que nous ___ les gourdes avant le départ.'],
 ['réfléchir','2p','Je souhaite que vous ___ à une deuxième solution.'],
 ['grandir','3p','Pour cette expérience, il faut que les plantes ___ à la lumière.'],
 ['nourrir','1s','Il faut que je ___ le lapin pendant ton absence.'],
 ['ralentir','2s','Il faut que tu ___ à l’entrée du village.'],
 ['obéir','3s','Il faut que le robot ___ à cette nouvelle commande.'],
 ['applaudir','1p','Elle souhaite que nous ___ tous les participants.'],
 ['choisir','2p','Il faut que vous ___ les documents utiles pour votre dossier.'],
 ['rougir','3p','Pour les cueillir, il faut que ces tomates ___ encore un peu.'],
 ['manger','1s','Il faut que je ___ avant de prendre ce médicament.'],
 ['nager','2s','Il faut que tu ___ près du bord pour cet exercice.'],
 ['voyager','3s','La famille préfère que Nora ___ avec un accompagnateur.'],
 ['bouger','1p','Il faut que nous ___ doucement pour ne pas réveiller le chat.'],
 ['ranger','2p','Je souhaite que vous ___ ces outils dans le placard.'],
 ['changer','3p','Il faut que les joueurs ___ de côté à la pause.'],
 ['partager','1s','Tu souhaites que je ___ mon écran pendant la réunion.'],
 ['mélanger','2s','Il faut que tu ___ la peinture avant de commencer.'],
 ['charger','3s','Il faut que le technicien ___ la batterie de secours.'],
 ['manger','1p','Je préfère que nous ___ après la visite du musée.'],
 ['voyager','2p','Il faut que vous ___ avec vos billets et vos papiers.'],
 ['nager','3p','Le moniteur souhaite que les élèves ___ par groupes de trois.'],
 ['commencer','1s','Il faut que je ___ par vérifier les mesures.'],
 ['lancer','2s','Je souhaite que tu ___ le dé au milieu de la table.'],
 ['avancer','3s','Il faut que le bus ___ pour libérer le passage.'],
 ['placer','1p','Il faut que nous ___ la table près de la prise.'],
 ['annoncer','2p','Je souhaite que vous ___ le programme aux invités.'],
 ['remplacer','3p','Il faut que les mécaniciens ___ les pneus usés.'],
 ['effacer','1s','Tu préfères que je ___ ce trait de crayon.'],
 ['tracer','2s','Il faut que tu ___ un cercle autour du symbole.'],
 ['commencer','3s','Nous souhaitons que le concert ___ à l’heure prévue.'],
 ['lancer','1p','Il faut que nous ___ les invitations cette semaine.'],
 ['avancer','2p','Il faut que vous ___ jusqu’à la ligne bleue.'],
 ['placer','3p','Je préfère que les élèves ___ leurs sacs sous les tables.'],
];

export const SUBJONCTIF_FAMILY_APPLICATIONS = contexts.map(([verb, person, sentence], index) => {
 const answer = conjugate(verb, 'subjonctif_present', person);
 const family = ['regular_er', 'regular_ir', 'spelling_ger', 'spelling_cer'][Math.floor(index / 12)];
 return {verb, person, family, answer, sentence: conjugationSentenceGap(sentence, answer)};
});
