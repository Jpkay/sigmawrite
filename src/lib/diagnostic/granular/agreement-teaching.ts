import type {TargetTeachingContent} from "./teaching-content";

type Case={sentence:string;verb:string;answer:string;subject:string;reason:string};
function practice(construction:string,cases:Case[]){
 return cases.map((item,index)=>({id:`agreement-${construction}-guide-${index+1}`,
  promptFr:`Complète avec « ${item.verb} » au présent. Écris seulement le verbe.\n\n${item.sentence}`,
  answerFr:item.answer,hintFr:`Le sujet est « ${item.subject} ». ${item.reason}`,
  explanationFr:`${item.sentence.replace("___",item.answer)}\n${item.reason} On écrit donc « ${item.answer} ».`}));
}
const drafts:TargetTeachingContent[]=[
 {
  id:"french-v3-teaching:agreement:adjacent",nodeKey:"accorder_sujet_verbe_ecrit",facetKey:"accorder_sujet_verbe_ecrit::construction:adjacent",mode:"production",status:"draft_requires_review",
  titleFr:"Accorder le verbe avec le sujet placé juste avant",learnerQuestionFr:"Pourquoi écrit-on « elle dessine », mais « elles dessinent » ?",
  steps:[
   {exampleFr:"La voisine dessine. Les voisines dessinent.",explanationFr:"La première phrase parle d’une seule voisine; la seconde, de plusieurs. La fin du verbe change à l’écrit, même si dessine et dessinent se prononcent de la même façon."},
   {exampleFr:"La voisine → elle → dessine\nLes voisines → elles → dessinent",explanationFr:"Le sujet indique ici qui dessine. Remplace le groupe sujet par elle ou elles : ce pronom aide à choisir la forme du verbe. On appelle ce lien l’accord du verbe avec son sujet."},
   {exampleFr:"Le rideau bouge. Les rideaux bougent.",explanationFr:"Le sujet peut aussi désigner un objet. Avec il, bouger s’écrit bouge; avec ils, bougent. On ne met pas un s au verbe simplement parce que le nom est au pluriel."},
  ],
  takeawayFr:"Repère le sujet, remplace-le par il, elle, ils ou elles, puis choisis la forme correspondante du verbe.",
  boundaryFr:"Ces exercices portent sur un sujet placé juste avant un verbe au présent, à la troisième personne. Les terminaisons ne sont pas les mêmes pour tous les verbes : elles finissent, elles vont. Savoir accorder ces phrases ne prouve pas encore que tu sais le faire dans un texte entier.",
  practice:practice("adjacent",[
   {sentence:"Le robot ___ les miettes.",verb:"aspirer",answer:"aspire",subject:"Le robot",reason:"Le robot peut être remplacé par il, au singulier."},
   {sentence:"Les touristes ___ le musée.",verb:"visiter",answer:"visitent",subject:"Les touristes",reason:"Le groupe « Les touristes » peut être remplacé par ils, au pluriel."},
   {sentence:"Cette lampe ___ le couloir.",verb:"éclairer",answer:"éclaire",subject:"Cette lampe",reason:"Le groupe « Cette lampe » peut être remplacé par elle, au singulier."},
   {sentence:"Les branches ___ au vent.",verb:"trembler",answer:"tremblent",subject:"Les branches",reason:"Le groupe « Les branches » peut être remplacé par elles, au pluriel."},
  ]),
 },
 {
  id:"french-v3-teaching:agreement:separated",nodeKey:"accorder_sujet_verbe_ecrit",facetKey:"accorder_sujet_verbe_ecrit::construction:separated",mode:"production",status:"draft_requires_review",
  titleFr:"Retrouver le sujet malgré les mots entre les deux",learnerQuestionFr:"Dans « Le panier de pommes tombe », faut-il suivre panier ou pommes ?",
  steps:[
   {exampleFr:"Le panier de pommes tombe.",explanationFr:"C’est le panier qui tombe. Le groupe de pommes précise son contenu. Le mot principal du groupe sujet, appelé noyau, est panier : il est singulier. On écrit tombe, même si pommes est pluriel."},
   {exampleFr:"Les paniers de la marchande tombent.",explanationFr:"Cette fois, le noyau est paniers. Tout le groupe sujet peut être remplacé par ils. Marchande est plus proche du verbe, mais ce nom ne commande pas son accord."},
   {exampleFr:"La gardienne, près des portes, patiente.",explanationFr:"Près des portes indique un lieu. En retirant cette précision, on obtient La gardienne patiente. Le sujet reste au singulier : la proximité du mot portes ne change rien."},
  ],
  takeawayFr:"Ne choisis pas automatiquement le nom le plus proche. Retrouve le groupe sujet et son noyau; vérifie quel pronom peut remplacer tout le groupe.",
  boundaryFr:"Cette leçon utilise des groupes avec un noyau clairement singulier ou pluriel. Les expressions de quantité comme beaucoup de et les accords avec des noms collectifs demandent d’autres repères.",
  practice:practice("separated",[
   {sentence:"Le sac de billes ___ dans l’escalier.",verb:"rouler",answer:"roule",subject:"Le sac de billes",reason:"Le noyau sac est singulier : on peut remplacer le groupe par il."},
   {sentence:"Les touches du piano ___ sous ses doigts.",verb:"bouger",answer:"bougent",subject:"Les touches du piano",reason:"Le noyau touches est pluriel : on peut remplacer le groupe par elles."},
   {sentence:"La musicienne, devant les enfants, ___ sa guitare.",verb:"accorder",answer:"accorde",subject:"La musicienne",reason:"Devant les enfants précise le lieu. Le sujet peut être remplacé par elle."},
   {sentence:"Les vélos de ma sœur ___ sous la pluie.",verb:"rouiller",answer:"rouillent",subject:"Les vélos de ma sœur",reason:"Le noyau vélos est pluriel. Sœur ne commande pas l’accord."},
  ]),
 },
 {
  id:"french-v3-teaching:agreement:inverted",nodeKey:"accorder_sujet_verbe_ecrit",facetKey:"accorder_sujet_verbe_ecrit::construction:inverted",mode:"production",status:"draft_requires_review",
  titleFr:"Accorder quand le sujet vient après le verbe",learnerQuestionFr:"Dans « Où habitent tes cousins ? », quel mot commande habitent ?",
  steps:[
   {exampleFr:"Où habitent tes cousins ? Tes cousins habitent ici.",explanationFr:"La question place le sujet tes cousins après le verbe. Remettre le sujet devant aide à voir le lien : tes cousins correspond à ils, donc habitent."},
   {exampleFr:"Au fond des grottes coule une rivière. Une rivière coule au fond des grottes.",explanationFr:"Une rivière est le sujet, au singulier. Au fond des grottes indique un lieu. Le pluriel de grottes ne commande pas l’accord du verbe coule."},
   {exampleFr:"Sous le pont passent deux péniches. Deux péniches passent sous le pont.",explanationFr:"La position change, mais le nombre du sujet reste le même. Deux péniches correspond à elles : on écrit passent."},
  ],
  takeawayFr:"Cherche aussi le sujet après le verbe. Remets-le mentalement devant, puis choisis la forme du verbe qui lui correspond.",
  boundaryFr:"Ces exercices portent sur un sujet nominal placé après le verbe. Les questions avec un pronom et un trait d’union, comme vient-elle, nécessitent aussi des règles de ponctuation qui ne sont pas travaillées ici.",
  practice:practice("inverted",[
   {sentence:"Près des rochers ___ un pêcheur.",verb:"patienter",answer:"patiente",subject:"un pêcheur",reason:"Un pêcheur patiente : le sujet est singulier, même après le verbe."},
   {sentence:"Dans la vitrine ___ les bijoux.",verb:"briller",answer:"brillent",subject:"les bijoux",reason:"Les bijoux brillent : le sujet est pluriel. Vitrine indique un lieu."},
   {sentence:"Quand ___ la répétition ?",verb:"débuter",answer:"débute",subject:"la répétition",reason:"La répétition débute à une certaine heure : le sujet est singulier."},
   {sentence:"Au loin ___ les lumières du village.",verb:"scintiller",answer:"scintillent",subject:"les lumières du village",reason:"Le noyau lumières est pluriel; on peut remplacer le groupe par elles."},
  ]),
 },
 {
  id:"french-v3-teaching:agreement:coordinated",nodeKey:"accorder_sujet_verbe_ecrit",facetKey:"accorder_sujet_verbe_ecrit::construction:coordinated",mode:"production",status:"draft_requires_review",
  titleFr:"Accorder avec deux sujets reliés par et",learnerQuestionFr:"Pourquoi « Nora et Malik discutent » prend-il un verbe au pluriel ?",
  steps:[
   {exampleFr:"Nora discute. Malik discute. Nora et Malik discutent.",explanationFr:"La troisième phrase réunit deux personnes distinctes avec et. Le groupe Nora et Malik peut être remplacé par ils : on écrit discutent."},
   {exampleFr:"La radio et la télévision fonctionnent.",explanationFr:"Chaque nom est singulier, mais les deux appareils forment ensemble un sujet pluriel. L’accord concerne tout le groupe, pas seulement télévision."},
   {exampleFr:"Le cousin et la cousine marchent. Le cousin, avec sa cousine, marche.",explanationFr:"Et relie ici deux sujets : ils marchent. Dans la seconde phrase, avec sa cousine est une précision détachée; le sujet reste le cousin : il marche. Les deux constructions ne fonctionnent pas de la même façon."},
  ],
  takeawayFr:"Quand et réunit deux personnes ou choses distinctes dans le sujet, prends-les ensemble pour choisir le pluriel du verbe.",
  boundaryFr:"On travaille ici des sujets à la troisième personne qui désignent des êtres ou choses distincts. Toi et moi, les groupes reliés par ou, et deux noms désignant une seule personne demandent d’autres règles.",
  practice:practice("coordinated",[
   {sentence:"Le frère et la sœur ___ une cabane.",verb:"fabriquer",answer:"fabriquent",subject:"Le frère et la sœur",reason:"Deux personnes distinctes sont réunies par et : le sujet correspond à ils."},
   {sentence:"La lune et les étoiles ___ le ciel.",verb:"éclairer",answer:"éclairent",subject:"La lune et les étoiles",reason:"Les deux groupes sont réunis dans un sujet pluriel."},
   {sentence:"La veste et l’écharpe ___ près du radiateur.",verb:"rester",answer:"restent",subject:"La veste et l’écharpe",reason:"Deux vêtements distincts forment ensemble un sujet pluriel."},
   {sentence:"Inès et Jade ___ la chorégraphie.",verb:"inventer",answer:"inventent",subject:"Inès et Jade",reason:"Les deux personnes peuvent être remplacées par elles, au pluriel."},
  ]),
 },
];
const modelVerbs:Record<string,Array<{lemma:string;form:string}>>={
 adjacent:[{lemma:"dessiner",form:"dessine"},{lemma:"bouger",form:"bouge"},{lemma:"finir",form:"finissent"},{lemma:"aller",form:"vont"}],
 separated:[{lemma:"tomber",form:"tombe"},{lemma:"patienter",form:"patiente"}],
 inverted:[{lemma:"habiter",form:"habitent"},{lemma:"couler",form:"coule"},{lemma:"passer",form:"passent"},{lemma:"venir",form:"vient"}],
 coordinated:[{lemma:"discuter",form:"discute"},{lemma:"fonctionner",form:"fonctionnent"},{lemma:"marcher",form:"marchent"}],
};
/** These examples and corrections are exposure, never independent evidence. */
export const AGREEMENT_TEACHING:readonly TargetTeachingContent[]=drafts.map(lesson=>({...lesson,
 materialExposure:{words:[...modelVerbs[lesson.id.split(":").at(-1)!],...lesson.practice.map(exercise=>{
  const lemma=exercise.promptFr.match(/^Complète avec « (.+?) »/u)![1];return {lemma,form:lemma};
 })],sentences:[...lesson.steps.map(step=>step.exampleFr),...lesson.practice.map(exercise=>exercise.explanationFr.split("\n")[0])]},
}));
