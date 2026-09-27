import type {TargetTeachingContent} from "./teaching-content";
export const SPELLING_TEACHING:readonly TargetTeachingContent[]=[
 {
  id:"spelling-m-before-mbp",nodeKey:"appliquer_m_devant_m_b_p",mode:"production",status:"draft_requires_review",
  titleFr:"Choisir n ou m dans un mot",learnerQuestionFr:"Pourquoi écrit-on un m dans « nombre » ?",
  steps:[
   {exampleFr:"nombre : om + b\ncompote : om + p",explanationFr:"Dans ces mots, regarde la lettre qui vient juste après om : b dans nombre, p dans compote. Devant ces lettres, le son que l’on écrit souvent on s’écrit ici om."},
   {exampleFr:"emmitoufler : em + m",explanationFr:"S’emmitoufler, c’est s’envelopper dans des vêtements pour avoir chaud. Le premier m se trouve devant un autre m. Pour les sons écrits an, en, in ou on, on emploie généralement m à la place de n devant m, b ou p."},
   {exampleFr:"ranger : an + g",explanationFr:"Ici, la lettre suivante est g. La règle de m devant m, b, p ne s’applique pas : on garde n dans ranger. Il faut regarder la lettre suivante, pas ajouter m partout."},
   {exampleFr:"bonbonnière : on + b",explanationFr:"Une bonbonnière est une boîte où l’on garde des friandises. Ce mot fait exception : le premier n reste n malgré le b qui suit. Certaines orthographes doivent donc être mémorisées."},
  ],
  takeawayFr:"Repère la lettre juste après le son écrit an, en, in ou on. Devant m, b ou p, pense à m. Vérifie aussi si le mot fait partie des exceptions apprises.",
  boundaryFr:"Cette règle concerne ces graphies nasales. Elle ne permet pas de changer tous les n d’un mot et ne remplace pas l’apprentissage des exceptions. Un mot inconnu peut demander une vérification dans le dictionnaire.",
  materialExposure:{words:["nombre","compote","emmitoufler","ranger","bonbonnière","emballage","trombone","grimper","empiler","menton"].map(lemma=>({lemma,form:lemma}))},
  practice:[
   {id:"nasal-guide-1",promptFr:"Complète le mot et écris-le en entier : Recycle cet e___ballage en carton.",answerFr:"emballage",hintFr:"La lettre juste après le trou est b. Pense à la graphie em.",explanationFr:"On écrit emballage avec m devant b."},
   {id:"nasal-guide-2",promptFr:"Complète le mot et écris-le en entier : Un tro___bone maintient les feuilles ensemble.",answerFr:"trombone",hintFr:"Regarde le b placé après la lettre manquante.",explanationFr:"Trombone s’écrit avec om devant b."},
   {id:"nasal-guide-3",promptFr:"Complète le mot et écris-le en entier : Le chat veut gri___per sur le mur.",answerFr:"grimper",hintFr:"La lettre suivante est p : quelle graphie remplace généralement in devant p ?",explanationFr:"On écrit grimper avec im devant p."},
   {id:"nasal-guide-4",promptFr:"Complète le mot et écris-le en entier : Nous allons e___piler les assiettes.",answerFr:"empiler",hintFr:"La lettre après le trou est p. Pense à em.",explanationFr:"Empiler s’écrit avec m devant p."},
   {id:"nasal-guide-5",promptFr:"Complète le mot et écris-le en entier : Avec ce froid, mieux vaut s’e___mitoufler dans une écharpe.",answerFr:"emmitoufler",hintFr:"La lettre suivante est déjà un m. La règle s’applique aussi devant m.",explanationFr:"Emmitoufler commence par emm : le premier m précède le second."},
   {id:"nasal-guide-6",promptFr:"Complète le mot et écris-le en entier : Je vais ra___ger mes affaires.",answerFr:"ranger",hintFr:"Le g qui suit fait-il partie des trois lettres m, b, p ?",explanationFr:"Non : devant ce g, on garde n dans ranger."},
   {id:"nasal-guide-7",promptFr:"Complète le mot et écris-le en entier : Une goutte coule sur son me___ton.",answerFr:"menton",hintFr:"La lettre qui suit le trou est t. La règle de m devant m, b, p ne s’applique pas.",explanationFr:"On écrit menton avec n devant t."},
   {id:"nasal-guide-8",promptFr:"Complète le mot et écris-le en entier : La bo___bonnière contient des friandises.",answerFr:"bonbonnière",hintFr:"Ce mot est l’exception présentée dans la leçon.",explanationFr:"Bonbonnière conserve n devant le premier b. Appliquer m automatiquement donnerait une faute."},
  ],
 },
 {
  id:"spelling-regular-plural",nodeKey:"marquer_pluriel_nom_regulier",mode:"production",status:"draft_requires_review",
  titleFr:"Écrire un nom quand il y en a plusieurs",learnerQuestionFr:"Un ballon, puis trois ballons : qu’est-ce qui change à l’écrit ?",
  steps:[
   {exampleFr:"un ballon → trois ballons",explanationFr:"Le mot désigne maintenant plusieurs objets. On ajoute un s à la fin de ballon. Cette forme pour plusieurs êtres ou choses s’appelle le pluriel."},
   {exampleFr:"une fleur → des fleurs",explanationFr:"Le même changement fonctionne ici : on garde toutes les lettres de fleur et on ajoute s. Le s final ne s’entend généralement pas, mais il s’écrit."},
   {exampleFr:"un livre → mes livres",explanationFr:"Il n’y a pas toujours un nombre devant le nom. Des mots comme « mes » ou « plusieurs » indiquent aussi le pluriel."},
  ],
  takeawayFr:"Cherche si le nom désigne une seule chose ou plusieurs. Pour les noms réguliers de cette leçon, garde le mot entier et ajoute s au pluriel.",
  boundaryFr:"Tous les noms ne suivent pas ce modèle : un cheval donne des chevaux, et une souris donne des souris. Ces autres cas seront travaillés séparément.",
  materialExposure:{words:[{lemma:"ballon",form:"ballon"},{lemma:"fleur",form:"fleur"},{lemma:"livre",form:"livre"},{lemma:"cheval",form:"cheval"},{lemma:"souris",form:"souris"},{lemma:"biscuit",form:"biscuit"},{lemma:"tunnel",form:"tunnel"},{lemma:"bougie",form:"bougie"},{lemma:"cabane",form:"cabane"}]},
  practice:[
   {id:"plural-guide-1",promptFr:"Complète avec biscuit : Il reste trois ___.",answerFr:"biscuits",hintFr:"Trois indique plusieurs objets. Garde biscuit et ajoute la marque du pluriel.",explanationFr:"Biscuit prend un s : biscuits. Il y en a trois."},
   {id:"plural-guide-2",promptFr:"Complète avec tunnel : Le train traverse deux ___.",answerFr:"tunnels",hintFr:"Deux indique le pluriel. Ce nom suit le modèle régulier.",explanationFr:"On écrit tunnels : le mot tunnel est conservé, puis on ajoute s."},
   {id:"plural-guide-3",promptFr:"Complète avec bougie : Nous allumons plusieurs ___.",answerFr:"bougies",hintFr:"Le mot plusieurs donne le nombre, même sans chiffre.",explanationFr:"Plusieurs exige le pluriel. Bougie devient bougies."},
   {id:"plural-guide-4",promptFr:"Complète avec cabane : Les enfants visitent les ___.",answerFr:"cabanes",hintFr:"Les indique que le nom est au pluriel.",explanationFr:"On ajoute s à cabane : les cabanes."},
  ],
 },
 {
  id:"spelling-regular-feminine",nodeKey:"former_feminin_adjectif_regulier",mode:"production",status:"draft_requires_review",
  titleFr:"Écrire un adjectif au féminin",learnerQuestionFr:"Un plat salé, une soupe salée : pourquoi le mot change-t-il ?",
  steps:[
   {exampleFr:"un plat salé → une soupe salée",explanationFr:"Salé décrit le plat; salée décrit la soupe. Ce mot qui donne une caractéristique s’appelle un adjectif. Soupe est un nom féminin : on ajoute ici e à l’adjectif."},
   {exampleFr:"un voyage court → une promenade courte",explanationFr:"Pour ce modèle régulier, on conserve court et on ajoute e. Le mot décrit maintenant promenade, un nom féminin."},
   {exampleFr:"un séjour gratuit → une entrée gratuite",explanationFr:"Même si la prononciation change peu ou beaucoup selon le mot, vérifie la forme écrite. Ici, gratuit devient gratuite."},
  ],
  takeawayFr:"Repère le nom décrit par l’adjectif. S’il est féminin singulier et que l’adjectif suit ce modèle, garde la forme masculine et ajoute e.",
  boundaryFr:"On n’ajoute pas toujours simplement e : calme reste calme, et heureux devient heureuse. Cette leçon porte sur les adjectifs réguliers qui prennent e, pas sur toutes les formes du féminin.",
  materialExposure:{words:[{lemma:"salé",form:"salé"},{lemma:"court",form:"court"},{lemma:"gratuit",form:"gratuit"},{lemma:"calme",form:"calme"},{lemma:"heureux",form:"heureux"},{lemma:"poli",form:"poli"},{lemma:"joli",form:"joli"},{lemma:"pointu",form:"pointu"},{lemma:"droit",form:"droit"}]},
  practice:[
   {id:"feminine-guide-1",promptFr:"Complète avec poli au féminin : Cette réponse est très ___.",answerFr:"polie",hintFr:"Réponse est féminin. Ajoute e à poli.",explanationFr:"L’adjectif décrit la réponse : polie, avec e."},
   {id:"feminine-guide-2",promptFr:"Complète avec joli au féminin : Une ___ guirlande entoure la porte.",answerFr:"jolie",hintFr:"Le nom décrit est guirlande, au féminin singulier.",explanationFr:"Joli devient jolie pour décrire une guirlande."},
   {id:"feminine-guide-3",promptFr:"Complète avec pointu au féminin : Attention à cette pierre ___ !",answerFr:"pointue",hintFr:"Pointu décrit pierre. Conserve pointu et ajoute e.",explanationFr:"Pierre est féminin singulier : on écrit pointue."},
   {id:"feminine-guide-4",promptFr:"Complète avec droit au féminin : Trace une ligne ___.",answerFr:"droite",hintFr:"L’adjectif décrit une ligne, pas celui qui la trace.",explanationFr:"Une ligne est féminin singulier. Droit devient droite."},
  ],
 },
];
