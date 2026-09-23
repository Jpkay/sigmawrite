/** The subject is supplied: this assesses grammatical person/number, not subject
 * identification, verb spelling or the number of real-world people alone. */
import {PERSON_NUMBER_LABELS,PERSON_NUMBER_VERB_FORMS} from "./person-number-categories";
export {PERSON_NUMBER_LABELS} from "./person-number-categories";
type Verb=keyof typeof PERSON_NUMBER_VERB_FORMS;
const cases: Array<[string,string,string,number,Verb,string,string]> = [
 ["je-dessine","Je dessine un paysage.","Je",0,"aller","chercher un pinceau","Je commande la forme vais."],
 ["j-ecoute","J’écoute cette chanson.","Je",0,"être","près des enceintes","Je commande la forme suis."],
 ["je-negation","Je ne regarde pas la série.","Je",0,"être","encore occupé","La négation de la première phrase ne change pas la forme attendue avec je."],
 ["je-incise","Demain, je préparerai le repas.","je",0,"aller","acheter les ingrédients","Le moment indiqué ne change pas la forme attendue avec je."],
 ["tu-choisis","Tu choisis un livre.","Tu",1,"avoir","plusieurs choix","Tu commande la forme as."],
 ["tu-question","Pourquoi hésites-tu ?","tu",1,"être","presque prêt","Même après le verbe dans la première question, tu commande la forme es."],
 ["tu-negative","Tu ne connais pas ce chemin.","Tu",1,"aller","suivre le panneau","Tu commande la forme vas."],
 ["tu-future","Ce soir, tu présenteras ton dessin.","tu",1,"avoir","cinq minutes pour parler","Le moment de l’action ne change pas la forme attendue avec tu."],
 ["nom-singulier","Le robot avance sur la piste.","Le robot",2,"aller","tourner à gauche","Le robot commande la même forme que il : va."],
 ["elle","Elle range les pinceaux.","Elle",2,"avoir","encore de la peinture","Elle commande la forme a."],
 ["on-nous","On prépare notre spectacle. Ici, on désigne toute notre équipe.","On",2,"être","prêts à commencer","Même quand on désigne plusieurs personnes, on commande ici la forme est."],
 ["collectif","La foule applaudit.","La foule",2,"aller","quitter la salle","Le nom foule commande ici la forme va, même s’il désigne de nombreuses personnes."],
 ["nous","Nous inventons une histoire.","Nous",3,"avoir","beaucoup d’idées","Nous commande la forme avons."],
 ["toi-moi","Toi et moi partageons cette table.","Toi et moi",3,"être","près de la fenêtre","Toi et moi commande la même forme que nous : sommes."],
 ["elle-moi","Elle et moi dessinons les costumes.","Elle et moi",3,"aller","choisir les tissus","Elle et moi commande la même forme que nous : allons."],
 ["vous-moi","Vous et moi organiserons la rencontre.","Vous et moi",3,"avoir","le même programme","Vous et moi inclut la personne qui parle et commande avons."],
 ["vous-groupe","Vous cherchez vos places. Je parle à trois amis.","Vous",4,"aller","entrer ensemble","Vous commande la forme allez."],
 ["vous-politesse","Madame, vous pouvez entrer. Je parle à une seule personne.","vous",4,"être","attendue dans le bureau","Même adressé à une seule personne poliment, vous commande êtes."],
 ["toi-elle","Toi et elle préparerez les affiches.","Toi et elle",4,"avoir","tout le matériel","Toi et elle commande la même forme que vous : avez."],
 ["lui-toi","Lui et toi jouez dans la même équipe.","Lui et toi",4,"être","sur le terrain","Lui et toi commande la même forme que vous : êtes."],
 ["elles","Elles arrivent avant le début du film.","Elles",5,"avoir","des places au premier rang","Elles commande la forme ont."],
 ["noms-coordonnes","Lina et Sami ferment la porte.","Lina et Sami",5,"aller","rejoindre le groupe","Lina et Sami commande la même forme que ils : vont."],
 ["objets-pluriels","Les lampes éclairent la scène.","Les lampes",5,"être","près des rideaux","Les lampes commande la même forme que elles : sont."],
 ["lui-elle","Lui et elle repeignent le banc.","Lui et elle",5,"avoir","deux pots de peinture","Lui et elle commande la même forme que ils : ont."],
];
export const PERSON_NUMBER_DRAFTS = cases.map(([key,sentence,subject,index,verb,tail,reason])=>{
 const forms=PERSON_NUMBER_VERB_FORMS[verb],answer=forms[index],exerciseSubject=subject[0].toUpperCase()+subject.slice(1),exerciseSentence=`${exerciseSubject} ___ ${tail}.`;
 return {key,nodeKey:"distinguer_personne_nombre" as const,sentence,subject,personNumberGroup:PERSON_NUMBER_LABELS[index],exerciseSentence,
 prompt:`${sentence}\n\nComplète avec la bonne forme de « ${verb} » : « ${exerciseSentence} »`,
 answer,distractors:forms.filter(form=>form!==answer),reason};
});
