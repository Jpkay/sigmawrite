import {conjugate,type Person} from '@/lib/linguistic/conjugation';
import {conjugationSentenceGap} from './conjugation-sentence';
/** Separate application situations for spelling-family follow-up checks. */
const contexts:readonly [string,Person,string][]=[
 ['manger','1s','Je ___ une soupe après la randonnée.'],
 ['nager','2s','Tu ___ près du bord avec ton moniteur.'],
 ['voyager','3s','La dessinatrice ___ au Japon cet été.'],
 ['manger','1p','Nous ___ sur la terrasse après le concert.'],
 ['nager','2p','Vous ___ dans le bassin extérieur demain.'],
 ['voyager','3p','Les joueuses ___ ensemble pour le tournoi.'],
 ['voyager','1s','Je ___ avec une seule valise.'],
 ['manger','2s','Tu ___ les fraises du jardin au dessert.'],
 ['nager','3s','Mon frère ___ avec son club samedi.'],
 ['voyager','1p','Nous ___ en train pendant les vacances.'],
 ['manger','2p','Vous ___ avant de prendre le bus.'],
 ['nager','3p','Les enfants ___ après la séance de jeux.'],
 ['commencer','1s','Je ___ mon exposé par une photographie.'],
 ['lancer','2s','Tu ___ le ballon vers ta partenaire.'],
 ['avancer','3s','Le robot ___ jusqu’à la ligne rouge.'],
 ['commencer','1p','Nous ___ la répétition à quinze heures.'],
 ['lancer','2p','Vous ___ les anneaux autour des piquets.'],
 ['avancer','3p','Les randonneurs ___ jusqu’au prochain refuge.'],
 ['avancer','1s','Je ___ mon pion de trois cases.'],
 ['commencer','2s','Tu ___ la recette par le mélange des œufs.'],
 ['lancer','3s','La joueuse ___ le dé sur le plateau.'],
 ['avancer','1p','Nous ___ les chaises vers la scène.'],
 ['commencer','2p','Vous ___ votre fresque demain matin.'],
 ['lancer','3p','Les bénévoles ___ une collecte de livres.'],
];
export const FUTUR_SIMPLE_FAMILY_APPLICATIONS=contexts.map(([verb,person,sentence])=>({verb,person,sentence:conjugationSentenceGap(sentence,conjugate(verb,'futur_simple',person)),answer:conjugate(verb,'futur_simple',person)}));
