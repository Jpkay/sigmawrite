export type SpellingDraft={key:string;nodeKey:"marquer_pluriel_nom_regulier"|"former_feminin_adjectif_regulier";lemma:string;answer:string;sentence:string;reason:string};
/** Original controlled-production examples. Each target word is different so
 * repeat exposure to one lemma cannot masquerade as transfer to new words. */
const plural:readonly [string,string,string][]=[
 ["dessin","dessins","Dans son carnet, Inès garde plusieurs ___."],
 ["bracelet","bracelets","Nous fabriquons deux ___ pour la fête."],
 ["dragon","dragons","Trois ___ apparaissent dans ce manga."],
 ["jardin","jardins","Le quartier possède des ___ partagés."],
 ["chemin","chemins","Sur la carte, plusieurs ___ mènent au lac."],
 ["lapin","lapins","La vétérinaire examine deux ___."],
 ["patin","patins","Avant de monter sur la glace, je lace mes ___."],
 ["cousin","cousins","Mes deux ___ viennent passer la journée ici."],
 ["maison","maisons","Le village compte vingt ___."],
 ["lanterne","lanternes","Des ___ éclairent la cour."],
 ["étoile","étoiles","Cette nuit, nous observons les ___."],
 ["valise","valises","Les voyageurs déposent leurs ___ près du bus."],
 ["tomate","tomates","Pour la sauce, coupe quatre ___."],
 ["affiche","affiches","Les élèves accrochent des ___ dans le couloir."],
 ["chanson","chansons","Le groupe joue cinq ___ pendant le concert."],
 ["ruban","rubans","Elle décore les cadeaux avec des ___."],
];
const feminine:readonly [string,string,string][]=[
 ["petit","petite","La ___ tortue se cache sous une feuille."],
 ["grand","grande","Une ___ armoire occupe le fond de la pièce."],
 ["vert","verte","Lina choisit une veste ___."],
 ["bleu","bleue","La voiture ___ attend devant le garage."],
 ["noir","noire","Une chatte ___ traverse la cour."],
 ["gris","grise","Une brume ___ couvre la vallée."],
 ["rond","ronde","La table ___ peut accueillir quatre personnes."],
 ["haut","haute","Une ___ tour domine le village."],
 ["clair","claire","Une lumière ___ entre par la fenêtre."],
 ["brun","brune","Une feuille ___ tombe de la branche."],
 ["lourd","lourde","Cette caisse est trop ___ pour moi."],
 ["fort","forte","Une ___ pluie interrompt le match."],
 ["étroit","étroite","La ruelle ___ débouche sur une place."],
 ["profond","profonde","Une grotte ___ s’ouvre dans la falaise."],
 ["chaud","chaude","La soupe est encore ___."],
 ["froid","froide","L’eau du ruisseau est ___."],
];
export const SPELLING_DRAFTS:readonly SpellingDraft[]=[
 ...plural.map(([lemma,answer,sentence])=>({key:`plural-${lemma}`,nodeKey:"marquer_pluriel_nom_regulier" as const,lemma,answer,sentence,reason:`Le contexte exige un nom au pluriel. Ce nom régulier prend un s au pluriel : ${answer}.`})),
 ...feminine.map(([lemma,answer,sentence])=>({key:`feminine-${lemma}`,nodeKey:"former_feminin_adjectif_regulier" as const,lemma,answer,sentence,reason:`L’adjectif décrit ici un nom féminin singulier. On ajoute e à ${lemma} : ${answer}.`})),
];
