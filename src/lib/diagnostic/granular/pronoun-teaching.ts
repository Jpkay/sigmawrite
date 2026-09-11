import type {TargetTeachingContent} from "./teaching-content";

const nodeKey="placer_pronom_complement";
const extraSentences:Record<string,string[]>={
 finite:["Regarde-le !","Je vais le regarder"],
 infinitive:["Je le fais réparer"],
 negative:["Je le regarde pas","ne la ferme pas","ne ferme-la pas"],
 imperative:["Lève-toi !","Prends-le !","Ne le prends pas !","regarde-moi","regarde-me"],
};
const make=(value:string,content:Omit<TargetTeachingContent,"id"|"nodeKey"|"facetKey"|"mode"|"status">):TargetTeachingContent=>({
  id:`french-v3-teaching:pronoun-placement:${value}`,nodeKey,facetKey:`${nodeKey}::construction:${value}`,
  mode:"production",status:"draft_requires_review",...content,
  // These authored steps use sentence pairs separated by arrows or punctuation.
  // Record each sentence, not the surrounding task instruction. This annotation
  // still needs semantic/completeness review before publication.
  materialExposure:{sentences:[...new Set([
   ...content.steps.flatMap(step=>step.exampleFr.split("→").flatMap(part=>part.trim().split(/(?<=[.!?])\s+/))),
   ...content.practice.flatMap(exercise=>[exercise.promptFr.match(/«\s*([^»]+?)\s*»/u)![1],exercise.answerFr]),
   ...(extraSentences[value]??[]),
  ])]},
});

export const PRONOUN_PLACEMENT_TEACHING:readonly TargetTeachingContent[]=[
  make("finite",{
    titleFr:"Placer le petit mot avant le verbe",
    learnerQuestionFr:"Où mettre « le », « la » ou « les » quand je remplace un nom ?",
    steps:[
      {exampleFr:"Ce manga ? Lina le lit.",explanationFr:"« Le » remplace « ce manga ». On le place entre « Lina » et « lit ». Ce petit mot qui reprend un nom s’appelle un pronom."},
      {exampleFr:"Ces photos ? Nous les regardons.",explanationFr:"Le pronom « les » se place juste avant « regardons », le verbe qui change avec le sujet : je regarde, nous regardons."},
      {exampleFr:"Ce film ? Lina l’a regardé.",explanationFr:"Quand le verbe comporte deux mots, comme « a regardé », le pronom vient avant le premier : « l’a regardé ». Ce premier mot, ici « a », est l’auxiliaire."},
    ],
    takeawayFr:"Dans ces phrases, place le pronom avant le verbe conjugué, ou avant l’auxiliaire si le temps est composé.",
    boundaryFr:"Cette place change dans un ordre affirmatif : « Regarde-le ! » Si le pronom complète un infinitif, comme « regarder », on dit « Je vais le regarder ». Ces deux cas ont leur propre leçon.",
    practice:[
      {id:"guided:placement:finite:1",promptFr:"Réécris « Sami regarde le match » en remplaçant « le match » par « le ».",answerFr:"Sami le regarde.",hintFr:"Place « le » juste avant « regarde ».",explanationFr:"« Le » reprend « le match » et se place avant le verbe « regarde »."},
      {id:"guided:placement:finite:2",promptFr:"Réécris « Nous invitons nos amis » en remplaçant « nos amis » par « les ».",answerFr:"Nous les invitons.",hintFr:"Le verbe conjugué est « invitons ».",explanationFr:"On écrit « les invitons » : le pronom précède le verbe."},
      {id:"guided:placement:finite:3",promptFr:"Réécris « Nora a rangé son sac » en remplaçant « son sac » par « l’ ».",answerFr:"Nora l’a rangé.",hintFr:"Place « l’ » avant l’auxiliaire « a ».",explanationFr:"Le pronom se place avant « a », et non entre « a » et « rangé »."},
    ],
  }),
  make("infinitive",{
    titleFr:"Placer le pronom avec l’action qu’il complète",
    learnerQuestionFr:"Pourquoi dit-on « Je vais le lire » ?",
    steps:[
      {exampleFr:"Je vais lire ce manga. → Je vais le lire.",explanationFr:"Le manga est ce que je vais lire. Le pronom « le » se place donc juste avant « lire ». « Lire » est un infinitif : la forme du verbe que tu trouves dans un dictionnaire."},
      {exampleFr:"Tu peux ouvrir la fenêtre. → Tu peux l’ouvrir.",explanationFr:"La fenêtre complète l’action « ouvrir ». On place « l’ » devant « ouvrir », même si « peux » est le verbe conjugué."},
      {exampleFr:"Elle essaie de comprendre cette règle. → Elle essaie de la comprendre.",explanationFr:"On garde « de » et on place « la » juste devant « comprendre ». Le pronom reste avec l’action qu’il complète."},
    ],
    takeawayFr:"Avec « aller », « pouvoir », « vouloir » ou « essayer de » suivis d’un infinitif, place le pronom juste avant l’infinitif qu’il complète.",
    boundaryFr:"Ne transforme pas ce repère en règle pour tous les verbes. « Faire » suivi d’un infinitif a une construction particulière : « Je le fais réparer ». Ce cas n’est pas travaillé ici.",
    practice:[
      {id:"guided:placement:infinitive:1",promptFr:"Réécris « Adam veut regarder le film » en remplaçant « le film » par « le ».",answerFr:"Adam veut le regarder.",hintFr:"Le film est ce qu’Adam veut regarder.",explanationFr:"« Le » complète « regarder », donc il vient juste avant cet infinitif."},
      {id:"guided:placement:infinitive:2",promptFr:"Réécris « Nous allons inviter nos voisins » en remplaçant « nos voisins » par « les ».",answerFr:"Nous allons les inviter.",hintFr:"Place le pronom avec « inviter ».",explanationFr:"« Allons » indique le futur proche. Le pronom complète l’action « inviter »."},
      {id:"guided:placement:infinitive:3",promptFr:"Réécris « Elle essaie de réparer la lampe » en remplaçant « la lampe » par « la ».",answerFr:"Elle essaie de la réparer.",hintFr:"Garde « de », puis place le pronom avant « réparer ».",explanationFr:"On écrit « de la réparer » : « la » reste juste devant l’infinitif qu’il complète."},
    ],
  }),
  make("negative",{
    titleFr:"Garder le pronom à sa place avec « ne… pas »",
    learnerQuestionFr:"Où mettre le pronom quand la phrase dit non ?",
    steps:[
      {exampleFr:"Je le regarde. → Je ne le regarde pas.",explanationFr:"Le pronom « le » reste devant « regarde ». On ajoute « ne » avant le pronom et « pas » après le verbe."},
      {exampleFr:"Je l’ai vu. → Je ne l’ai pas vu.",explanationFr:"Avec un temps composé, « pas » vient après l’auxiliaire « ai ». Le pronom reste avant cet auxiliaire."},
      {exampleFr:"Regarde-le ! → Ne le regarde pas !",explanationFr:"Dans un ordre négatif, le pronom revient devant le verbe. On retire le trait d’union utilisé dans l’ordre affirmatif."},
      {exampleFr:"Je ne vais pas le regarder.",explanationFr:"Si « ne… pas » entoure « vais », le pronom qui complète « regarder » reste devant cet infinitif. On ne le déplace pas devant « vais »."},
    ],
    takeawayFr:"Repère d’abord l’action que le pronom complète. Avec un verbe conjugué, l’ordre est « ne + pronom + verbe + pas » ; avec un infinitif, le pronom reste devant cet infinitif.",
    boundaryFr:"À l’oral, on entend souvent « Je le regarde pas ». Pour cet entraînement à l’écrit, garde les deux mots « ne » et « pas ».",
    practice:[
      {id:"guided:placement:negative:1",promptFr:"Mets « Tu les connais » à la forme négative avec « ne… pas ».",answerFr:"Tu ne les connais pas.",hintFr:"Commence par « Tu ne les… ».",explanationFr:"« Les » reste devant « connais ». « Ne » vient avant le pronom et « pas » après le verbe."},
      {id:"guided:placement:negative:2",promptFr:"Mets l’ordre « Ferme-la ! » à la forme négative avec « ne… pas ».",answerFr:"Ne la ferme pas !",hintFr:"Le pronom revient avant « ferme » et le trait d’union disparaît.",explanationFr:"Dans cet ordre négatif, on écrit « ne la ferme pas », et non « ne ferme-la pas »."},
      {id:"guided:placement:negative:3",promptFr:"Mets « Nous l’avons lu » à la forme négative avec « ne… pas ».",answerFr:"Nous ne l’avons pas lu.",hintFr:"Place « pas » juste après « avons ».",explanationFr:"Le pronom reste avant l’auxiliaire : « ne l’avons pas lu »."},
      {id:"guided:placement:negative:4",promptFr:"Réécris « Je ne veux pas acheter ce jeu » en remplaçant « ce jeu » par « l’ ».",answerFr:"Je ne veux pas l’acheter.",hintFr:"Le pronom complète « acheter ».",explanationFr:"« Ne… pas » entoure « veux ». « L’ » reste devant l’infinitif « acheter »."},
    ],
  }),
  make("imperative",{
    titleFr:"Placer le pronom après un ordre affirmatif",
    learnerQuestionFr:"Pourquoi écrit-on « Lis-le ! » avec un trait d’union ?",
    steps:[
      {exampleFr:"Tu lis ce manga. → Lis-le !",explanationFr:"« Lis-le ! » donne une consigne. Dans un ordre affirmatif, le pronom vient après le verbe et on les relie par un trait d’union. Cette forme du verbe s’appelle l’impératif."},
      {exampleFr:"Fermez la porte. → Fermez-la.",explanationFr:"La même place s’applique quand on s’adresse à plusieurs personnes ou qu’on vouvoie quelqu’un : verbe, trait d’union, pronom."},
      {exampleFr:"Tu me regardes. → Regarde-moi !",explanationFr:"Après cet impératif affirmatif, « me » devient « moi ». De même, on écrit « Lève-toi ! », avec « toi » à la place de « te »."},
    ],
    takeawayFr:"Pour un ordre affirmatif avec un seul pronom, écris le verbe puis un trait d’union et le pronom : « Prends-le ! »",
    boundaryFr:"Dans un ordre négatif, on revient à « Ne le prends pas ! ». Les suites de deux pronoms et les formes avec « y » ou « en » demandent d’autres repères ; elles ne sont pas entraînées ici.",
    practice:[
      {id:"guided:placement:imperative:1",promptFr:"Réécris l’ordre « Prends le carnet ! » en remplaçant « le carnet » par « le ».",answerFr:"Prends-le !",hintFr:"Place « le » après « prends » et relie-les par un trait d’union.",explanationFr:"L’ordre est affirmatif : le pronom suit le verbe."},
      {id:"guided:placement:imperative:2",promptFr:"Réécris « Rangez les ballons ! » en remplaçant « les ballons » par « les ».",answerFr:"Rangez-les !",hintFr:"Le verbe reste « rangez ».",explanationFr:"Même avec « vous », le pronom suit l’impératif et un trait d’union les relie."},
      {id:"guided:placement:imperative:3",promptFr:"Donne la consigne correspondant à « Tu me regardes ». Commence par « Regarde ».",answerFr:"Regarde-moi !",hintFr:"Après cet impératif affirmatif, « me » devient « moi ».",explanationFr:"On dit « regarde-moi », et non « regarde-me »."},
    ],
  }),
];
