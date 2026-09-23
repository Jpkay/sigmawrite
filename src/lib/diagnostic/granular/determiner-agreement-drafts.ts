/** Recognition questions ask the learner to make the agreement decision itself.
 * The wording avoids requiring an analysis of grammar terminology first. */
const cases:Array<[string,string,string,[string,string,string],boolean,string]>=[
 ["bateau","___ bateau quitte le port.","Le",["La","Les","L’"],false,"Le convient devant le nom bateau."],
 ["fleur","___ fleur pousse près du mur.","Cette",["Ce","Ces","Cet"],false,"Cette convient devant le nom fleur."],
 ["cahiers","___ cahiers restent sur la table.","Mes",["Mon","Ma","Cette"],false,"Mes convient devant le nom cahiers."],
 ["valise","___ petite valise attend dans l’entrée.","Une",["Un","Des","Ces"],false,"Une convient devant le groupe petite valise."],
 ["arbres","___ arbres perdent leurs feuilles.","Ces",["Ce","Cet","Cette"],false,"Ces convient devant le nom arbres."],
 ["leur-voiture","La voiture appartient aux voisins. Ils lavent ___ voiture.","leur",["leurs","son","ses"],false,"Leur convient parce qu’une seule voiture appartient à plusieurs voisins."],
 ["leurs-voitures","Les voitures appartiennent aux voisins. Ils lavent ___ voitures.","leurs",["leur","son","ses"],false,"Leurs convient parce que plusieurs voitures appartiennent aux voisins."],
 ["chaque","On considère les élèves un par un. ___ élève reçoit une feuille.","Chaque",["Plusieurs","Ces","Des"],false,"Chaque convient quand on considère les élèves un par un."],
 ["plusieurs","Il manque plus d’une page au dossier. ___ pages manquent.","Plusieurs",["Chaque","Une","La"],false,"Plusieurs convient quand plus d’une page manque."],
 ["musee","___ musée ouvre ses portes.","Un",["Une","Des","La"],false,"Un convient devant le nom musée."],
 ["des-filles","___ filles installent la scène.","Des",["Un","Une","La"],false,"Des convient devant le nom filles."],
 ["ma-maison","Je parle de la maison qui m’appartient. ___ maison se trouve près de la gare.","Ma",["Mon","Mes","Sa"],false,"Ma convient pour parler de ma maison."],
 ["sans-nom","Elle sourit.\n\nQuelle autre phrase place un petit mot correctement devant le nom « élève » ?","Cette élève sourit.",["Elle sourit.","Ces élève sourit.","Cette élèves sourit."],true,"Cette est placé devant le nom élève; dans elle sourit, elle remplace la personne qui sourit."],
 ["la-pronom","Je la regarde.\n\nDans quelle phrase « la » est-il placé juste devant le nom d’une chose ?","Je regarde la vitrine.",["Je la regarde.","La regarde est ouverte.","Je regarde les vitrines."],true,"Dans la vitrine, la est placé devant le nom vitrine; dans je la regarde, la remplace ce qui est regardé."],
 ["les-pronom","Tu les invites.\n\nDans quelle phrase « les » est-il placé juste devant le nom de plusieurs personnes ?","Tu invites les voisins.",["Tu les invites.","Les invites arrivent.","Tu invites le voisin."],true,"Dans les voisins, les est placé devant le nom voisins; dans tu les invites, les remplace les personnes invitées."],
 ["leur-pronom","Nous leur parlons.\n\nDans quelle phrase « leur » est-il placé juste devant le nom d’une personne ?","Nous parlons à leur professeure.",["Nous leur parlons.","Nous parlons à leurs professeure.","Nous parlons à leur."],true,"Dans leur professeure, leur est placé devant le nom professeure; dans nous leur parlons, leur remplace les personnes à qui nous parlons."],
];
export const DETERMINER_AGREEMENT_DRAFTS=cases.map(([key,sentence,answer,distractors,negative,reason])=>({key,sentence,nodeKey:"construction_accord_determinant_nom" as const,prompt:sentence.includes("\n\n")?sentence:`${sentence}\n\nQuel mot complète correctement la phrase ?`,answer,distractors,negative,reason}));
