/** The subject is supplied: this assesses grammatical person/number, not subject
 * identification, verb spelling or the number of real-world people alone. */
import {PERSON_NUMBER_LABELS} from "./person-number-categories";
export {PERSON_NUMBER_LABELS} from "./person-number-categories";
const cases: Array<[string,string,string,number,string]> = [
 ["je-dessine","Je dessine un paysage.","Je",0,"Je désigne la personne qui parle : première personne du singulier."],
 ["j-ecoute","J’écoute cette chanson.","J’",0,"J’ est la forme de je devant une voyelle; la personne et le nombre ne changent pas."],
 ["je-negation","Je ne regarde pas la série.","Je",0,"La négation ne change pas les traits du sujet je."],
 ["je-incise","Demain, je préparerai le repas.","je",0,"Le moment de l’action ne change pas la personne et le nombre de je."],
 ["tu-choisis","Tu choisis un livre.","Tu",1,"Tu désigne une seule personne à qui l’on parle."],
 ["tu-question","Pourquoi hésites-tu ?","tu",1,"Même après le verbe dans une question, tu reste à la deuxième personne du singulier."],
 ["tu-negative","Tu ne connais pas ce chemin.","Tu",1,"La négation ne modifie pas les traits de tu."],
 ["tu-future","Ce soir, tu présenteras ton dessin.","tu",1,"Le futur du verbe ne modifie pas les traits de tu."],
 ["nom-singulier","Le robot avance sur la piste.","Le robot",2,"Ce groupe se remplace par il : troisième personne du singulier, même si le robot n’est pas humain."],
 ["elle","Elle range les pinceaux.","Elle",2,"Elle désigne un être dont on parle : troisième personne du singulier."],
 ["on-nous","On prépare notre spectacle. Ici, on désigne toute notre équipe.","On",2,"Même quand on désigne plusieurs personnes, sa personne grammaticale reste la troisième du singulier."],
 ["collectif","La foule applaudit.","La foule",2,"Le nom foule est singulier. Le groupe se remplace par elle, même s’il désigne de nombreuses personnes."],
 ["nous","Nous inventons une histoire.","Nous",3,"Nous comprend la personne qui parle et au moins une autre personne."],
 ["toi-moi","Toi et moi partageons cette table.","Toi et moi",3,"La personne qui parle, moi, fait partie du groupe : on le remplace par nous."],
 ["elle-moi","Elle et moi dessinons les costumes.","Elle et moi",3,"Un groupe comprenant moi se remplace ici par nous, pas par elles."],
 ["vous-moi","Vous et moi organiserons la rencontre.","Vous et moi",3,"Le groupe inclut moi : la première personne commande l’accord au pluriel."],
 ["vous-groupe","Vous cherchez vos places. Je parle à trois amis.","Vous",4,"Vous s’adresse ici à plusieurs personnes : deuxième personne du pluriel."],
 ["vous-politesse","Madame, vous pouvez entrer. Je parle à une seule personne.","vous",4,"Le vous de politesse garde les traits grammaticaux de la deuxième personne du pluriel pour le verbe."],
 ["toi-elle","Toi et elle préparerez les affiches.","Toi et elle",4,"Le groupe inclut la personne à qui l’on parle, toi, sans inclure moi : il se remplace par vous."],
 ["lui-toi","Lui et toi jouez dans la même équipe.","Lui et toi",4,"Lui et toi se remplace par vous : deuxième personne du pluriel."],
 ["elles","Elles arrivent avant le début du film.","Elles",5,"Elles désigne plusieurs êtres dont on parle : troisième personne du pluriel."],
 ["noms-coordonnes","Lina et Sami ferment la porte.","Lina et Sami",5,"Ces deux personnes sont celles dont on parle : le groupe se remplace par ils."],
 ["objets-pluriels","Les lampes éclairent la scène.","Les lampes",5,"Les lampes se remplace par elles : troisième personne du pluriel, même pour des objets."],
 ["lui-elle","Lui et elle repeignent le banc.","Lui et elle",5,"Ni moi ni toi ne figure dans ce groupe : il se remplace par ils."],
];
export const PERSON_NUMBER_DRAFTS = cases.map(([key,sentence,subject,index,reason])=>({
 key,nodeKey:"distinguer_personne_nombre" as const,sentence,subject,
 prompt:`${sentence}\n\nQuelle personne et quel nombre grammaticaux correspondent au sujet « ${subject} » pour l’accord du verbe ?`,
 answer:PERSON_NUMBER_LABELS[index],distractors:PERSON_NUMBER_LABELS.filter((_,i)=>i!==index),reason,
}));
