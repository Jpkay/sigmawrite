import {conjugate,type Person} from '@/lib/linguistic/conjugation';
import {conjugationSentenceGap} from './conjugation-sentence';
/** Imagined situations; tense is supplied, so tense choice is not assessed. */
const contexts:readonly [string,Person,string][]=[
 ['manger','1s','Avec plus de temps, je ___ à la cantine.'],
 ['nager','2s','Avec des lunettes, tu ___ plus facilement.'],
 ['voyager','3s','Avec ce billet, ma sœur ___ en première classe.'],
 ['manger','1p','Sans cette pluie, nous ___ dans le jardin.'],
 ['nager','2p','Avec une eau plus chaude, vous ___ plus longtemps.'],
 ['voyager','3p','Sans leurs examens, les étudiantes ___ avec nous.'],
 ['voyager','1s','Avec quelques économies, je ___ en Italie.'],
 ['manger','2s','Après une longue promenade, tu ___ volontiers ce sandwich.'],
 ['nager','3s','Sans sa blessure, la sportive ___ dans le grand bassin.'],
 ['voyager','1p','Avec un train direct, nous ___ plus souvent.'],
 ['manger','2p','Avec des places libres, vous ___ près de la fenêtre.'],
 ['nager','3p','Avec un accompagnateur, les débutants ___ jusqu’à la bouée.'],
 ['commencer','1s','Avec ton accord, je ___ les préparatifs.'],
 ['lancer','2s','Avec une balle plus légère, tu ___ plus loin.'],
 ['avancer','3s','Sans cet obstacle, le chariot ___ sans difficulté.'],
 ['commencer','1p','Avec une salle disponible, nous ___ le spectacle.'],
 ['lancer','2p','Avec cette rampe, vous ___ les billes vers la cible.'],
 ['avancer','3p','Sans le vent, les voiliers ___ moins vite.'],
 ['avancer','1s','Avec une lampe, je ___ plus vite dans ce tunnel.'],
 ['commencer','2s','À ma place, tu ___ par la question la plus courte.'],
 ['lancer','3s','Avec de nouveaux moyens, la mairie ___ ce projet.'],
 ['avancer','1p','Avec une carte, nous ___ sans hésitation.'],
 ['commencer','2p','Avec un four libre, vous ___ la cuisson.'],
 ['lancer','3p','Avec leurs amis, les élèves ___ un club de lecture.'],
];
export const CONDITIONNEL_FAMILY_APPLICATIONS=contexts.map(([verb,person,sentence])=>({verb,person,sentence:conjugationSentenceGap(sentence,conjugate(verb,'conditionnel_present',person)),answer:conjugate(verb,'conditionnel_present',person)}));
