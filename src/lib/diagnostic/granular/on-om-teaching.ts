import type {TargetTeachingContent} from "./teaching-content";
const recognition:TargetTeachingContent={
 id:"french-v3-teaching:on-om:recognition",nodeKey:"orthographier_nasale_on_om",mode:"recognition",status:"draft_requires_review",
 titleFr:"Choisir entre on et om",learnerQuestionFr:"Pourquoi un même son s’écrit-il de deux façons dans « pompon » ?",
 steps:[
  {exampleFr:"pompon : pom / pon",explanationFr:"Dans pompon, on entend deux fois le même son nasal, celui de on. La première fois, il s’écrit om ; la deuxième, on. Le son seul ne suffit donc pas pour choisir les lettres."},
  {exampleFr:"pompon : om devant p ; bombe : om devant b",explanationFr:"Regarde la lettre qui suit le son. Devant b ou p, on écrit généralement om. Une graphie est une façon d’écrire un son : on et om sont ici deux graphies du même son."},
  {exampleFr:"citron ; front",explanationFr:"Dans citron, on est à la fin du mot. Dans front, on est suivi de t. On garde n dans ces deux mots ; le repère b ou p n’apparaît pas après le son."},
  {exampleFr:"bonbon : le premier on est suivi de b",explanationFr:"Bonbon est une exception : le premier n reste n malgré le b. Une règle aide à choisir, mais certaines orthographes se mémorisent mot par mot."},
 ],
 takeawayFr:"Pour ce son nasal, regarde ce qui suit : on s’écrit généralement om devant b ou p. Vérifie aussi les exceptions, comme bonbon.",
 boundaryFr:"Ce repère concerne le son nasal de on. Il ne permet pas de remplacer tous les n d’un mot. La leçon montre des cas courants et une exception, sans couvrir tout le vocabulaire français.",
 practice:[
  {id:"on-om-recognition-1",promptFr:"Quel mot est correctement écrit ?",choices:["pompon","ponpon"],answerFr:"pompon",hintFr:"Pour le premier son, la lettre suivante est p.",explanationFr:"On écrit om devant ce p : pompon. Le second son s’écrit on à la fin du mot."},
  {id:"on-om-recognition-2",promptFr:"Choisis l’orthographe correcte du fruit.",choices:["citron","citrom"],answerFr:"citron",hintFr:"Il n’y a pas de b ou de p après le son final.",explanationFr:"Citron se termine par on."},
  {id:"on-om-recognition-3",promptFr:"Choisis le mot correctement écrit.",choices:["bombe","bonbe"],answerFr:"bombe",hintFr:"Regarde le b après la voyelle o et la lettre à choisir.",explanationFr:"Devant b, le son s’écrit ici om : bombe."},
  {id:"on-om-recognition-4",promptFr:"Choisis le mot correctement écrit : Le bandeau couvre son ___.",choices:["front","fromt"],answerFr:"front",hintFr:"La lettre suivante est t, pas b ou p.",explanationFr:"Front s’écrit avec on devant t."},
  {id:"on-om-recognition-5",promptFr:"Quelle friandise garde exceptionnellement n devant le premier b ?",choices:["bonbon","bombon"],answerFr:"bonbon",hintFr:"C’est l’exception présentée dans la leçon.",explanationFr:"Le mot bonbon garde n devant b. Écrire m automatiquement donnerait une faute."},
  {id:"on-om-recognition-6",promptFr:"Quel mot contient à la fois om et on ?",choices:["pompon","citron","front","bonbon"],answerFr:"pompon",hintFr:"Observe séparément les deux parties pom et pon.",explanationFr:"Pompon contient om devant p, puis on à la fin. Le choix dépend de la place du son dans le mot."},
 ],
};
const cases:readonly [string,string,string,string][]=[
 ["compas","Le co___pas permet de tracer un cercle.","Le trou est suivi de p.","Compas s’écrit avec om devant p."],
 ["bidon","Le bido___ contient de l’eau.","Le son se trouve à la fin du mot, sans b ou p après lui.","Bidon se termine par on."],
 ["pompier","Le po___pier déroule le tuyau.","La lettre après le trou est p.","Pompier s’écrit avec om devant p."],
 ["plafond","Une lampe éclaire le plafo___d.","Regarde le d qui suit le trou.","Plafond s’écrit avec on devant d."],
 ["ombrelle","Elle ouvre son o___brelle pour se protéger du soleil.","La lettre après le trou est b.","Ombrelle s’écrit avec om devant b."],
 ["bonbon","Le bo___bon est enveloppé dans du papier.","Ce mot est une exception à mémoriser.","Bonbon garde le premier n devant b, malgré le repère habituel."],
];
const production:TargetTeachingContent={
 id:"french-v3-teaching:on-om:production",nodeKey:"orthographier_nasale_on_om",mode:"production",status:"draft_requires_review",
 titleFr:"Compléter un mot avec on ou om",learnerQuestionFr:"Comment compléter « la tro_pe de l’éléphant » sans choisir au hasard ?",
 steps:[
  {exampleFr:"la tro_pe de l’éléphant → la trompe de l’éléphant",explanationFr:"Le contexte permet de reconnaître le mot trompe. Regarde la lettre après le trou : p. Le son nasal s’écrit ici om. Écris le mot entier, trompe, puis relis-le."},
  {exampleFr:"un cocho_ → un cochon",explanationFr:"Le son nasal est à la fin de cochon. Il n’est pas suivi de b ou de p : on conserve la graphie on."},
  {exampleFr:"un bo_bon → un bonbon",explanationFr:"Bonbon fait exception : le premier son s’écrit on même devant b. Le repère sur la lettre suivante doit être complété par la mémoire du mot."},
 ],
 takeawayFr:"Reconnais le mot grâce à la phrase, regarde la lettre qui suit le trou, puis choisis n ou m. Relis le mot entier et pense aux exceptions connues.",
 boundaryFr:"Le reste du mot est déjà fourni dans cet entraînement. Réussir à le compléter ne prouve pas encore que tu sauras l’écrire spontanément dans un texte. Si tu ne connais pas le mot, vérifie-le ensuite dans un dictionnaire.",
 practice:cases.map(([answer,sentence,hint,explanation],index)=>({id:`on-om-production-${index+1}`,promptFr:`Complète la lettre manquante et écris le mot entier.\n\n${sentence}`,answerFr:answer,hintFr:hint,explanationFr:explanation})),
};
export const ON_OM_TEACHING:readonly TargetTeachingContent[]=[recognition,production].map(lesson=>({...lesson,materialExposure:{words:(lesson.mode==="recognition"?["pompon","bombe","citron","front","bonbon"]:["trompe","cochon",...cases.map(row=>row[0])]).map(lemma=>({lemma,form:lemma}))}}));
