import type {DiagnosticDifficultyTier} from "../item-bank";
import type {TargetTeachingContent} from "./teaching-content";

export type DiscourseRelationKey="consequence"|"contrast"|"concession"|"chronology";
type Pool="initial"|"learning";
type Pair={left:string;right:string};
type RecognitionSeed={sentence:string;answer:RelationAnalysis;explanationFr:string;negative:boolean};

export const RELATION_ANALYSES=[
 "Une cause explique un fait.",
 "Un fait entraîne un résultat.",
 "Deux faits sont mis en opposition.",
 "Un obstacle est reconnu, mais le résultat se produit.",
 "Des actions sont ordonnées dans le temps.",
 "Deux informations sont simplement ajoutées.",
] as const;
export type RelationAnalysis=typeof RELATION_ANALYSES[number];
const CAUSE=RELATION_ANALYSES[0],CONSEQUENCE=RELATION_ANALYSES[1],CONTRAST=RELATION_ANALYSES[2],CONCESSION=RELATION_ANALYSES[3],CHRONOLOGY=RELATION_ANALYSES[4],ADDITION=RELATION_ANALYSES[5];

const capitalize=(value:string)=>value.charAt(0).toLocaleUpperCase("fr")+value.slice(1);
const sentence=(value:string)=>`${capitalize(value)}.`;
const joiners:Record<DiscourseRelationKey,(pair:Pair)=>string>={
 consequence:({left,right})=>`${capitalize(left)}, donc ${right}.`,
 contrast:({left,right})=>`${capitalize(left)}, mais ${right}.`,
 concession:({left,right})=>`Même si ${left}, ${right}.`,
 chronology:({left,right})=>`${capitalize(left)}, puis ${right}.`,
};
const reverseJoiners:Record<DiscourseRelationKey,(pair:Pair)=>string>={
 consequence:({left,right})=>`${capitalize(right)}, donc ${left}.`,
 contrast:({left,right})=>`${capitalize(right)}, mais ${left}.`,
 concession:({left,right})=>`Même si ${right}, ${left}.`,
 chronology:({left,right})=>`${capitalize(right)}, puis ${left}.`,
};
export const DISCOURSE_RELATION_CONNECTORS:Record<DiscourseRelationKey,string>={consequence:"donc",contrast:"mais",concession:"même si",chronology:"puis"};
const tier=(index:number,total:number):{pool:Pool;difficultyTier:DiagnosticDifficultyTier;difficulty:number}=>{
 const local=index%(total/2),difficultyTier:DiagnosticDifficultyTier=local<2?"foundation":local<4?"core":"stretch";
 return {pool:index<total/2?"initial":"learning",difficultyTier,difficulty:difficultyTier==="foundation"?35:difficultyTier==="core"?50:65};
};

const recognition:Record<DiscourseRelationKey,readonly RecognitionSeed[]>={
 consequence:[
  {sentence:"Le vent se lève, donc les voiliers rentrent au port.",answer:CONSEQUENCE,explanationFr:"Le retour au port est présenté comme le résultat du vent.",negative:false},
  {sentence:"Les voiliers rentrent au port parce que le vent se lève.",answer:CAUSE,explanationFr:"Parce que introduit la raison du retour, pas sa conséquence.",negative:true},
  {sentence:"Le four ne chauffe plus; par conséquent, le gâteau reste cru.",answer:CONSEQUENCE,explanationFr:"Le gâteau cru est le résultat du four en panne.",negative:false},
  {sentence:"Mina prépare la pâte, puis elle allume le four.",answer:CHRONOLOGY,explanationFr:"Puis ordonne les actions sans présenter un résultat.",negative:true},
  {sentence:"La route est barrée, si bien que le bus change d’itinéraire.",answer:CONSEQUENCE,explanationFr:"Le changement d’itinéraire découle de la route barrée.",negative:false},
  {sentence:"Le bus est ancien, mais ses sièges sont confortables.",answer:CONTRAST,explanationFr:"Mais oppose deux caractéristiques du bus.",negative:true},
  {sentence:"La batterie est vide; c’est pourquoi l’écran reste noir.",answer:CONSEQUENCE,explanationFr:"L’écran noir est la conséquence de la batterie vide.",negative:false},
  {sentence:"Comme la batterie est vide, nous cherchons un chargeur.",answer:CAUSE,explanationFr:"Comme introduit ici la cause de la recherche.",negative:true},
  {sentence:"Le gel a duré toute la nuit, de sorte que l’étang est couvert de glace.",answer:CONSEQUENCE,explanationFr:"La glace est présentée comme le résultat du gel.",negative:false},
  {sentence:"Le gardien ouvre la grille et salue les visiteurs.",answer:ADDITION,explanationFr:"Et ajoute deux actions du gardien.",negative:true},
  {sentence:"Une conduite a cassé; ainsi, l’eau est coupée dans la rue.",answer:CONSEQUENCE,explanationFr:"La coupure d’eau résulte de la conduite cassée.",negative:false},
  {sentence:"Même si une conduite a cassé, la bibliothèque reste ouverte.",answer:CONCESSION,explanationFr:"La casse est un obstacle qui n’empêche pas l’ouverture.",negative:true},
 ],
 contrast:[
  {sentence:"Lina préfère le thé, mais Karim choisit le café.",answer:CONTRAST,explanationFr:"Mais oppose deux préférences.",negative:false},
  {sentence:"Lina prépare le thé et Karim sert le café.",answer:ADDITION,explanationFr:"Et ajoute deux actions sans les opposer.",negative:true},
  {sentence:"Le matin est frais, tandis que l’après-midi est très chaud.",answer:CONTRAST,explanationFr:"Tandis que met les températures en contraste.",negative:false},
  {sentence:"Le matin est frais parce que le vent souffle du nord.",answer:CAUSE,explanationFr:"Le vent explique la fraîcheur du matin.",negative:true},
  {sentence:"Ce sac est léger; en revanche, cette valise est lourde.",answer:CONTRAST,explanationFr:"En revanche oppose le poids des deux bagages.",negative:false},
  {sentence:"Ce sac est léger, donc je le porte facilement.",answer:CONSEQUENCE,explanationFr:"La facilité est le résultat de la légèreté.",negative:true},
  {sentence:"Nora parle doucement, alors que son frère parle très fort.",answer:CONTRAST,explanationFr:"Alors que oppose deux manières de parler.",negative:false},
  {sentence:"Nora parle doucement, puis elle ferme la porte.",answer:CHRONOLOGY,explanationFr:"Puis place deux actions dans le temps.",negative:true},
  {sentence:"Le premier chemin est court; le second, au contraire, fait un long détour.",answer:CONTRAST,explanationFr:"Au contraire oppose la longueur des chemins.",negative:false},
  {sentence:"Même si le chemin est long, nous continuons la marche.",answer:CONCESSION,explanationFr:"La longueur est un obstacle qui n’arrête pas la marche.",negative:true},
  {sentence:"Aya travaille en silence, mais ses voisins discutent bruyamment.",answer:CONTRAST,explanationFr:"Mais oppose deux ambiances de travail.",negative:false},
  {sentence:"Aya travaille en silence car elle se concentre mieux ainsi.",answer:CAUSE,explanationFr:"Car introduit la raison du silence.",negative:true},
 ],
 concession:[
  {sentence:"Même s’il pleut, les enfants jouent dehors.",answer:CONCESSION,explanationFr:"La pluie est un obstacle qui n’empêche pas le jeu.",negative:false},
  {sentence:"Il pleut, donc les enfants rentrent.",answer:CONSEQUENCE,explanationFr:"Le retour est présenté comme le résultat de la pluie.",negative:true},
  {sentence:"Bien que le magasin soit petit, il propose beaucoup de produits.",answer:CONCESSION,explanationFr:"La petite taille pourrait limiter le choix, mais ce n’est pas le cas.",negative:false},
  {sentence:"Le magasin est petit et il ferme à dix-huit heures.",answer:ADDITION,explanationFr:"Et ajoute deux informations.",negative:true},
  {sentence:"Malgré sa fatigue, Hugo termine son exposé.",answer:CONCESSION,explanationFr:"La fatigue n’empêche pas Hugo de terminer.",negative:false},
  {sentence:"Hugo termine son exposé parce que la classe l’attend.",answer:CAUSE,explanationFr:"L’attente de la classe explique son action.",negative:true},
  {sentence:"Même si le train est en retard, Salomé arrive avant midi.",answer:CONCESSION,explanationFr:"Le retard est un obstacle qui n’empêche pas l’arrivée prévue.",negative:false},
  {sentence:"Le train est en retard, puis il s’arrête encore en gare.",answer:CHRONOLOGY,explanationFr:"Puis ordonne deux événements.",negative:true},
  {sentence:"Quoique la pente soit raide, le cycliste garde son rythme.",answer:CONCESSION,explanationFr:"La pente constitue un obstacle surmonté.",negative:false},
  {sentence:"La pente est raide, donc le cycliste ralentit.",answer:CONSEQUENCE,explanationFr:"Le ralentissement résulte de la pente.",negative:true},
  {sentence:"En dépit du bruit, le bébé reste endormi.",answer:CONCESSION,explanationFr:"Le bruit devrait gêner le sommeil, mais il ne le fait pas.",negative:false},
  {sentence:"Le bébé dort et sa sœur lit près de lui.",answer:ADDITION,explanationFr:"Et ajoute deux faits compatibles.",negative:true},
 ],
 chronology:[
  {sentence:"Yanis lace ses chaussures, puis il rejoint son équipe.",answer:CHRONOLOGY,explanationFr:"Puis indique l’ordre des deux actions.",negative:false},
  {sentence:"Yanis rejoint son équipe parce que le match commence.",answer:CAUSE,explanationFr:"Le début du match explique son déplacement.",negative:true},
  {sentence:"D’abord, on rince le riz; ensuite, on le verse dans la casserole.",answer:CHRONOLOGY,explanationFr:"D’abord et ensuite ordonnent les étapes.",negative:false},
  {sentence:"On rince le riz et on prépare les légumes.",answer:ADDITION,explanationFr:"Et ajoute deux actions sans préciser leur ordre.",negative:true},
  {sentence:"Après avoir fermé les volets, Inès éteint la lampe.",answer:CHRONOLOGY,explanationFr:"Après situe la fermeture avant l’extinction.",negative:false},
  {sentence:"Inès éteint la lampe, donc la pièce devient sombre.",answer:CONSEQUENCE,explanationFr:"L’obscurité est le résultat de l’extinction.",negative:true},
  {sentence:"Le facteur dépose le colis avant de sonner chez le voisin.",answer:CHRONOLOGY,explanationFr:"Avant de fixe l’ordre des actions.",negative:false},
  {sentence:"Le facteur porte un colis, mais sa sacoche est vide.",answer:CONTRAST,explanationFr:"Mais oppose le colis porté et la sacoche vide.",negative:true},
  {sentence:"Une fois le portail ouvert, le jardinier entre avec sa brouette.",answer:CHRONOLOGY,explanationFr:"L’ouverture précède l’entrée du jardinier.",negative:false},
  {sentence:"Même si le portail est lourd, le jardinier l’ouvre seul.",answer:CONCESSION,explanationFr:"Le poids est un obstacle surmonté.",negative:true},
  {sentence:"La cloche sonne; aussitôt, les élèves rangent leurs affaires.",answer:CHRONOLOGY,explanationFr:"Aussitôt situe le rangement juste après la sonnerie.",negative:false},
  {sentence:"La cloche sonne car la pause est terminée.",answer:CAUSE,explanationFr:"La fin de la pause explique la sonnerie.",negative:true},
 ],
};

const production:Record<DiscourseRelationKey,readonly Pair[]>={
 consequence:[
  {left:"le réveil n’a pas sonné",right:"Malo arrive en retard"},{left:"la neige fond",right:"le niveau du ruisseau monte"},{left:"le stade est complet",right:"les guichets ferment"},{left:"la farine manque",right:"nous changeons de recette"},
  {left:"le réseau est coupé",right:"le paiement échoue"},{left:"la température baisse",right:"la route devient glissante"},{left:"le chien aboie",right:"le bébé se réveille"},{left:"la serrure est cassée",right:"la porte reste ouverte"},
  {left:"le bus est supprimé",right:"Jade prend son vélo"},{left:"la rivière déborde",right:"le sentier ferme"},{left:"l’alarme retentit",right:"tout le monde quitte la salle"},{left:"le brouillard épaissit",right:"les conducteurs ralentissent"},
  {left:"la livraison tarde",right:"le magasin reporte l’ouverture"},{left:"le soleil revient",right:"la cour se remplit"},{left:"la lampe grille",right:"le couloir reste sombre"},{left:"le vent tombe",right:"le cerf-volant descend"},
 ],
 contrast:[
  {left:"Maya aime les romans",right:"Léo préfère les bandes dessinées"},{left:"le couloir est sombre",right:"la salle est lumineuse"},{left:"ce pull est épais",right:"cette veste est légère"},{left:"Nina court vite",right:"son frère marche lentement"},
  {left:"le marché est animé",right:"la rue voisine est calme"},{left:"ce jus est sucré",right:"la limonade est acide"},{left:"le premier exercice est court",right:"le second est long"},{left:"Amir parle peu",right:"sa cousine raconte tout"},
  {left:"le train est ancien",right:"ses sièges sont modernes"},{left:"la matinée est grise",right:"la soirée est claire"},{left:"la soupe est chaude",right:"le dessert est froid"},{left:"Lila choisit la montagne",right:"Noé préfère la mer"},
  {left:"la grande boîte est vide",right:"la petite boîte est pleine"},{left:"ce quartier est bruyant",right:"le parc voisin est paisible"},{left:"la consigne paraît simple",right:"l’exercice est difficile"},{left:"la table est neuve",right:"les chaises sont anciennes"},
 ],
 concession:[
  {left:"la pluie tombe",right:"nous déjeunons dehors"},{left:"le sac est lourd",right:"Mina le porte seule"},{left:"la nuit arrive",right:"les joueurs continuent la partie"},{left:"le pain est un peu sec",right:"les invités le mangent"},
  {left:"le chemin monte fortement",right:"le groupe garde son allure"},{left:"la salle est bruyante",right:"Yara termine sa lecture"},{left:"la file est longue",right:"les clients restent patients"},{left:"le vent souffle fort",right:"le ferry part à l’heure"},
  {left:"la batterie est presque vide",right:"le téléphone fonctionne encore"},{left:"le café est froid",right:"Émile le boit"},{left:"le match commence tôt",right:"toute l’équipe est présente"},{left:"la valise est petite",right:"tous les vêtements y tiennent"},
  {left:"le trajet dure trois heures",right:"les enfants restent calmes"},{left:"le texte contient des mots difficiles",right:"Ana comprend l’idée générale"},{left:"la fenêtre ferme mal",right:"la pièce reste chaude"},{left:"le magasin est loin",right:"nous y allons à pied"},
 ],
 chronology:[
  {left:"Lina ouvre son cahier",right:"elle copie la date"},{left:"le gardien déverrouille la porte",right:"les visiteurs entrent"},{left:"nous lavons les pommes",right:"nous les coupons"},{left:"Tom attache son casque",right:"il monte sur son vélo"},
  {left:"la musique s’arrête",right:"les danseurs saluent"},{left:"Aya lit la consigne",right:"elle commence l’exercice"},{left:"le serveur apporte les menus",right:"les clients commandent"},{left:"on mélange la peinture",right:"on l’applique sur le mur"},
  {left:"le train entre en gare",right:"les portes s’ouvrent"},{left:"Malo range les outils",right:"il balaie l’atelier"},{left:"la pluie cesse",right:"les enfants ressortent"},{left:"nous vérifions l’adresse",right:"nous envoyons le colis"},
  {left:"le film se termine",right:"les lumières se rallument"},{left:"Inès arrose les plantes",right:"elle ferme le robinet"},{left:"le professeur distribue les feuilles",right:"les élèves écrivent leur nom"},{left:"Samir éteint l’ordinateur",right:"il quitte le bureau"},
 ],
};

export const DISCOURSE_RELATIONS=[
 {key:"consequence",nodeKey:"relation_consequence",recognitionId:"C083",productionId:"C084",title:"conséquence",recognition,production},
 {key:"contrast",nodeKey:"relation_contraste",recognitionId:"C085",productionId:"C086",title:"contraste",recognition,production},
 {key:"concession",nodeKey:"relation_concession",recognitionId:"C087",productionId:"C088",title:"concession",recognition,production},
 {key:"chronology",nodeKey:"relation_chronologie",recognitionId:"C089",productionId:"C090",title:"chronologie",recognition,production},
] as const;

export const DISCOURSE_RELATION_QUESTIONS=DISCOURSE_RELATIONS.flatMap(definition=>[
 ...definition.recognition[definition.key].map((row,index)=>({...row,registryId:definition.recognitionId,relation:definition.key,...tier(index,12)})),
 ...definition.production[definition.key].map((pair,index)=>({registryId:definition.productionId,relation:definition.key,pair,answer:joiners[definition.key](pair),reverse:reverseJoiners[definition.key](pair),...tier(index,16)})),
]);

const guidedRecognition:Record<DiscourseRelationKey,readonly RecognitionSeed[]>={
 consequence:[
  {sentence:"La porte est bloquée, donc nous passons par le jardin.",answer:CONSEQUENCE,explanationFr:"Le passage par le jardin résulte de la porte bloquée.",negative:false},{sentence:"Nous passons par le jardin parce que la porte est bloquée.",answer:CAUSE,explanationFr:"Parce que introduit la raison.",negative:true},
  {sentence:"Le lait déborde; par conséquent, Léo baisse le feu.",answer:CONSEQUENCE,explanationFr:"L’action de Léo est le résultat du débordement.",negative:false},{sentence:"Léo baisse le feu, puis il remue la casserole.",answer:CHRONOLOGY,explanationFr:"Puis ordonne les actions.",negative:true},
  {sentence:"La cour est gelée, si bien que la récréation a lieu dedans.",answer:CONSEQUENCE,explanationFr:"La récréation intérieure découle du gel.",negative:false},{sentence:"La cour est gelée, mais le préau est sec.",answer:CONTRAST,explanationFr:"Mais oppose deux états.",negative:true},
 ],
 contrast:[
  {sentence:"Le chat reste dedans, mais le chien joue dehors.",answer:CONTRAST,explanationFr:"Mais oppose les lieux choisis.",negative:false},{sentence:"Le chat reste dedans et le chien dort.",answer:ADDITION,explanationFr:"Et ajoute deux faits.",negative:true},
  {sentence:"Cette rue est étroite; en revanche, l’avenue est large.",answer:CONTRAST,explanationFr:"En revanche oppose les largeurs.",negative:false},{sentence:"Cette rue est étroite, donc les voitures ralentissent.",answer:CONSEQUENCE,explanationFr:"Le ralentissement est un résultat.",negative:true},
  {sentence:"Ilyes dessine vite, tandis que Sara prend son temps.",answer:CONTRAST,explanationFr:"Tandis que oppose les rythmes.",negative:false},{sentence:"Ilyes dessine, puis Sara colorie.",answer:CHRONOLOGY,explanationFr:"Puis ordonne les actions.",negative:true},
 ],
 concession:[
  {sentence:"Même si le sol est humide, la course commence.",answer:CONCESSION,explanationFr:"L’humidité n’empêche pas la course.",negative:false},{sentence:"Le sol est humide, donc la course est annulée.",answer:CONSEQUENCE,explanationFr:"L’annulation est un résultat.",negative:true},
  {sentence:"Malgré le froid, les fenêtres restent ouvertes.",answer:CONCESSION,explanationFr:"Le froid est un obstacle qui ne change pas l’action.",negative:false},{sentence:"Les fenêtres restent ouvertes parce que la peinture sèche.",answer:CAUSE,explanationFr:"La peinture explique l’ouverture.",negative:true},
  {sentence:"Bien que la boîte soit lourde, Zoé la soulève.",answer:CONCESSION,explanationFr:"Le poids n’empêche pas Zoé d’agir.",negative:false},{sentence:"Zoé soulève la boîte, puis elle la pose sur l’étagère.",answer:CHRONOLOGY,explanationFr:"Puis ordonne les actions.",negative:true},
 ],
 chronology:[
  {sentence:"Nora met son manteau, puis elle sort.",answer:CHRONOLOGY,explanationFr:"Puis indique l’ordre.",negative:false},{sentence:"Nora met son manteau parce qu’il fait froid.",answer:CAUSE,explanationFr:"Le froid explique son choix.",negative:true},
  {sentence:"D’abord, on plie la feuille; ensuite, on la découpe.",answer:CHRONOLOGY,explanationFr:"Les marqueurs ordonnent les étapes.",negative:false},{sentence:"On plie la feuille et on range les ciseaux.",answer:ADDITION,explanationFr:"Et ajoute deux actions.",negative:true},
  {sentence:"Après le signal, les coureurs partent.",answer:CHRONOLOGY,explanationFr:"Après place le départ dans le temps.",negative:false},{sentence:"Le signal retentit, donc les coureurs partent.",answer:CONSEQUENCE,explanationFr:"Le départ est ici présenté comme un résultat.",negative:true},
 ],
};
const guidedProduction:Record<DiscourseRelationKey,readonly Pair[]>={
 consequence:[{left:"la salle est pleine",right:"nous ouvrons la seconde porte"},{left:"le ballon se dégonfle",right:"le jeu s’arrête"},{left:"la pluie redouble",right:"les promeneurs rentrent"},{left:"le pain brûle",right:"l’alarme sonne"},{left:"la clé manque",right:"Lina appelle le gardien"},{left:"le courant revient",right:"les lampes se rallument"}],
 contrast:[{left:"le lac est calme",right:"la rivière est agitée"},{left:"Mina aime se lever tôt",right:"Léo préfère dormir tard"},{left:"ce tissu est doux",right:"l’autre est rugueux"},{left:"le bureau est rangé",right:"l’atelier est en désordre"},{left:"la soupe est légère",right:"le plat principal est copieux"},{left:"le trajet aller est court",right:"le retour est long"}],
 concession:[{left:"le ciel est couvert",right:"la fête a lieu dehors"},{left:"la pente est raide",right:"Nora monte sans pause"},{left:"le billet est cher",right:"la salle est complète"},{left:"la recette est nouvelle",right:"Samir la réussit"},{left:"le réveil sonne tôt",right:"les enfants se lèvent sans protester"},{left:"la chaise est ancienne",right:"elle reste solide"}],
 chronology:[{left:"on épluche les carottes",right:"on les râpe"},{left:"Léo ferme sa valise",right:"il appelle un taxi"},{left:"la cloche sonne",right:"la classe se vide"},{left:"nous choisissons un livre",right:"nous passons à la caisse"},{left:"le peintre protège le sol",right:"il ouvre le pot"},{left:"Maya enregistre son document",right:"elle éteint l’ordinateur"}],
};

const lessonDetails:Record<DiscourseRelationKey,{recognitionSteps:TargetTeachingContent["steps"];productionSteps:TargetTeachingContent["steps"];takeaway:string;boundary:string}>={
 consequence:{recognitionSteps:[{exampleFr:"La roue est crevée, donc le vélo s’arrête.",explanationFr:"L’arrêt est le résultat de la roue crevée."},{exampleFr:"donc, par conséquent, si bien que, c’est pourquoi",explanationFr:"Ces expressions annoncent souvent un résultat. Vérifie toujours quel fait vient en premier."},{exampleFr:"Le vélo s’arrête parce que la roue est crevée.",explanationFr:"Parce que introduit la cause. Donc introduit la conséquence."}],productionSteps:[{exampleFr:"La roue est crevée. Le vélo s’arrête.",explanationFr:"La première idée provoque la seconde."},{exampleFr:"La roue est crevée, donc le vélo s’arrête.",explanationFr:"Écris la cause, ajoute donc, puis le résultat."},{exampleFr:"Que se passe-t-il à cause de la roue crevée ? Le vélo s’arrête.",explanationFr:"Cette question vérifie la direction de la conséquence."}],takeaway:"Repère d’abord le fait de départ, puis le résultat qu’il entraîne.",boundary:"Cette leçon travaille une conséquence explicitement exprimée dans une phrase, pas une conséquence implicite à inférer dans un texte."},
 contrast:{recognitionSteps:[{exampleFr:"Le salon est clair, mais le couloir est sombre.",explanationFr:"Les deux lieux ont des caractéristiques opposées."},{exampleFr:"mais, tandis que, alors que, en revanche, au contraire",explanationFr:"Ces expressions peuvent mettre deux faits en contraste."},{exampleFr:"Le salon est clair, donc nous ouvrons moins de lampes.",explanationFr:"Donc présente un résultat, pas une simple opposition."}],productionSteps:[{exampleFr:"Le salon est clair. Le couloir est sombre.",explanationFr:"Les deux idées présentent une différence nette."},{exampleFr:"Le salon est clair, mais le couloir est sombre.",explanationFr:"Garde l’ordre demandé et relie les faits avec mais."},{exampleFr:"Les deux faits peuvent-ils être comparés sans que l’un provoque l’autre ?",explanationFr:"Si oui, le contraste est cohérent."}],takeaway:"Mets côte à côte deux faits différents avec un marqueur d’opposition.",boundary:"Cette leçon vérifie un contraste explicite entre deux idées fournies; elle ne mesure pas la construction autonome d’un argument."},
 concession:{recognitionSteps:[{exampleFr:"Même si le vent souffle, le bateau quitte le quai.",explanationFr:"Le vent est un obstacle, mais le départ a quand même lieu."},{exampleFr:"même si, bien que, malgré, en dépit de",explanationFr:"Ces expressions reconnaissent un obstacle qui ne bloque pas le résultat."},{exampleFr:"Le vent souffle, donc le bateau reste au quai.",explanationFr:"Ici, le vent produit un résultat. Il n’est pas surmonté."}],productionSteps:[{exampleFr:"Le vent souffle. Le bateau quitte le quai.",explanationFr:"La première idée pourrait empêcher la seconde."},{exampleFr:"Même si le vent souffle, le bateau quitte le quai.",explanationFr:"Place même si devant l’obstacle, puis écris le résultat maintenu."},{exampleFr:"Le résultat arrive-t-il malgré l’obstacle ?",explanationFr:"Cette question distingue la concession de la conséquence."}],takeaway:"Présente l’obstacle avec même si, puis le résultat qui se produit malgré lui.",boundary:"Cette leçon vérifie une concession avec même si dans une combinaison contrôlée; elle n’évalue pas toutes les constructions concessives."},
 chronology:{recognitionSteps:[{exampleFr:"Mila ferme la fenêtre, puis elle tire le rideau.",explanationFr:"Puis situe la seconde action après la première."},{exampleFr:"d’abord, puis, ensuite, avant, après, aussitôt",explanationFr:"Ces expressions servent à ordonner des événements."},{exampleFr:"Mila ferme la fenêtre parce qu’il pleut.",explanationFr:"Parce que donne une raison, pas un ordre temporel."}],productionSteps:[{exampleFr:"Mila ferme la fenêtre. Elle tire le rideau.",explanationFr:"Les deux actions doivent garder cet ordre."},{exampleFr:"Mila ferme la fenêtre, puis elle tire le rideau.",explanationFr:"Écris la première action, ajoute puis, puis la seconde."},{exampleFr:"Quelle action arrive d’abord ?",explanationFr:"Relis la phrase pour vérifier que l’ordre n’a pas été inversé."}],takeaway:"Écris les actions dans leur ordre et relie-les avec un marqueur temporel.",boundary:"Cette leçon vérifie une chronologie explicite entre deux actions fournies; elle ne mesure pas une chronologie implicite dans un récit."},
};

export const DISCOURSE_RELATION_TEACHING:readonly TargetTeachingContent[]=DISCOURSE_RELATIONS.flatMap(definition=>{
 const details=lessonDetails[definition.key],recognitionPractice=guidedRecognition[definition.key].map((row,index)=>({id:`discourse-relations:${definition.recognitionId}:guided-${index+1}`,promptFr:`${row.sentence}\n\nQuelle relation unit les deux idées ?`,choices:[...RELATION_ANALYSES],answerFr:row.answer,hintFr:"Cherche le rôle logique du second fait, pas seulement le mot de liaison.",explanationFr:row.explanationFr}));
 const productionPractice=guidedProduction[definition.key].map((pair,index)=>{const answerFr=joiners[definition.key](pair);return {id:`discourse-relations:${definition.productionId}:guided-${index+1}`,promptFr:`Relie les deux idées avec « ${DISCOURSE_RELATION_CONNECTORS[definition.key]} » en gardant l’ordre donné.\n\n${sentence(pair.left)}\n${sentence(pair.right)}`,answerFr,hintFr:`Garde les deux idées et ajoute ${DISCOURSE_RELATION_CONNECTORS[definition.key]} à l’endroit indiqué.`,explanationFr:`${answerFr} La phrase exprime bien une relation de ${definition.title}.`};});
 return [
  {id:`french-v3-teaching:discourse-relation:${definition.key}:recognition`,nodeKey:definition.nodeKey,mode:"recognition",status:"draft_requires_review",titleFr:`Reconnaître une relation de ${definition.title}`,learnerQuestionFr:`Comment reconnaître une relation de ${definition.title} entre deux idées ?`,steps:details.recognitionSteps,takeawayFr:details.takeaway,boundaryFr:details.boundary,practice:recognitionPractice,materialExposure:{sentences:[...details.recognitionSteps.map(step=>step.exampleFr),...guidedRecognition[definition.key].map(row=>row.sentence)]}},
  {id:`french-v3-teaching:discourse-relation:${definition.key}:production`,nodeKey:definition.nodeKey,mode:"production",status:"draft_requires_review",titleFr:`Écrire une relation de ${definition.title}`,learnerQuestionFr:`Comment relier deux idées pour exprimer une relation de ${definition.title} ?`,steps:details.productionSteps,takeawayFr:details.takeaway,boundaryFr:details.boundary,practice:productionPractice,materialExposure:{sentences:[...details.productionSteps.map(step=>step.exampleFr),...guidedProduction[definition.key].flatMap(pair=>[sentence(pair.left),sentence(pair.right),joiners[definition.key](pair)])]}},
 ] satisfies TargetTeachingContent[];
});

export const DISCOURSE_RELATION_REVIEW=DISCOURSE_RELATIONS.flatMap(definition=>[
 {registryId:definition.recognitionId,skillId:`${definition.nodeKey}::reading-analysis`,status:"awaiting_real_review" as const,questionsFr:[`Les phrases positives expriment-elles sans ambiguïté la ${definition.title} annoncée ?`,`Les contre-exemples excluent-ils réellement la ${definition.title} tout en illustrant la relation indiquée ?`]},
 {registryId:definition.productionId,skillId:`${definition.nodeKey}::writing-controlled-production`,status:"awaiting_real_review" as const,questionsFr:[`La combinaison avec ${DISCOURSE_RELATION_CONNECTORS[definition.key]} reste-t-elle naturelle dans chaque contexte ?`,`L’ordre imposé produit-il une seule réponse attendue sans changer le sens des deux idées ?`]},
]);
