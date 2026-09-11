import type {TargetTeachingContent} from "./teaching-content";
const recognition:TargetTeachingContent={
 id:"french-v3-teaching:canonical-sentence:recognition",nodeKey:"construction_phrase_canonique",mode:"recognition",status:"draft_requires_review",
 titleFr:"Repérer l’ordre d’une phrase simple",learnerQuestionFr:"Dans « Lila plie une serviette », comment les trois groupes s’organisent-ils ?",
 steps:[
  {exampleFr:"Lila / plie / une serviette.",explanationFr:"Lila est le sujet : on peut dire elle plie. Plie est le verbe conjugué. Une serviette précise ce que Lila plie : c’est un complément du verbe. Ici, les trois groupes suivent l’ordre sujet, verbe, complément."},
  {exampleFr:"Le fleuriste / emballe / une plante.",explanationFr:"Le même ordre fonctionne avec un sujet de plusieurs mots. Garde le groupe Le fleuriste ensemble. Le complément une plante reste lui aussi un groupe."},
  {exampleFr:"Lila, une serviette.",explanationFr:"On reconnaît une personne et un objet, mais aucun verbe conjugué ne les relie. Ce groupe de mots ne suit pas le modèle de phrase verbale étudié ici."},
  {exampleFr:"Lila sourit.",explanationFr:"Cette phrase a un sujet et un verbe. Elle est complète même sans complément, car sourire n’en demande pas ici. Le modèle sujet, verbe, complément n’est donc pas une obligation pour toutes les phrases."},
 ],
 takeawayFr:"Repère d’abord le verbe conjugué, puis le sujet et le complément. Dans le modèle étudié, le sujet précède le verbe et le complément le suit.",
 boundaryFr:"Nous étudions ici des phrases déclaratives simples à la forme active. Des questions, des consignes ou des phrases avec un sujet placé après le verbe peuvent suivre un autre ordre. Une phrase sans complément n’est pas forcément incorrecte.",
 practice:[
  {id:"canonical-recognition-guide-1",promptFr:"Le gardien ferme le portail.\n\nQuelle analyse convient ?",choices:["Le gardien : sujet ; ferme : verbe ; le portail : complément.","Le portail : sujet ; ferme : verbe ; Le gardien : complément.","Ferme : sujet ; le portail : verbe.","Il n’y a pas de verbe conjugué."],answerFr:"Le gardien : sujet ; ferme : verbe ; le portail : complément.",hintFr:"On peut remplacer Le gardien par il : il ferme le portail.",explanationFr:"Le gardien est le sujet du verbe ferme. Le portail précise ce qu’il ferme."},
  {id:"canonical-recognition-guide-2",promptFr:"Les clientes choisissent des bouquets.\n\nQuel groupe est le complément du verbe ?",choices:["des bouquets","Les clientes","choisissent","Les clientes choisissent"],answerFr:"des bouquets",hintFr:"Que choisissent les clientes ?",explanationFr:"Des bouquets précise ce que les clientes choisissent. Ce groupe vient après le verbe."},
  {id:"canonical-recognition-guide-3",promptFr:"Le gardien, le portail.\n\nQuel élément manque pour suivre le modèle sujet, verbe, complément ?",choices:["Un verbe conjugué.","Un deuxième sujet.","Un mot indiquant demain.","Une deuxième virgule."],answerFr:"Un verbe conjugué.",hintFr:"Cherche un mot qui relie le gardien à ce qu’il fait au portail.",explanationFr:"Il manque un verbe conjugué, comme ferme. Ajouter une virgule ne remplit pas ce rôle."},
  {id:"canonical-recognition-guide-4",promptFr:"Ma camarade découpe du carton.\n\nQuel est le groupe sujet entier ?",choices:["Ma camarade","Ma","du carton","découpe"],answerFr:"Ma camarade",hintFr:"Quel groupe peut être remplacé par elle ?",explanationFr:"Ma camarade est le groupe sujet. Ma tout seul ne désigne pas la personne."},
  {id:"canonical-recognition-guide-5",promptFr:"Le bébé dort.\n\nPourquoi cette phrase peut-elle être complète ?",choices:["Elle contient un sujet et un verbe qui n’exige pas de complément ici.","Dort est un complément.","Le bébé est un verbe.","Toutes les phrases doivent contenir trois groupes."],answerFr:"Elle contient un sujet et un verbe qui n’exige pas de complément ici.",hintFr:"Dormir peut s’employer sans préciser un objet de l’action.",explanationFr:"Le bébé est le sujet et dort le verbe. Le modèle à trois groupes n’épuise pas toutes les phrases possibles."},
  {id:"canonical-recognition-guide-6",promptFr:"Les élèves du club fabriquent des cerfs-volants.\n\nQuelle séparation respecte les groupes ?",choices:["Les élèves du club / fabriquent / des cerfs-volants.","Les élèves / du club fabriquent / des cerfs-volants.","Les élèves du / club / fabriquent des cerfs-volants.","Les / élèves du club / fabriquent des cerfs-volants."],answerFr:"Les élèves du club / fabriquent / des cerfs-volants.",hintFr:"Du club précise de quels élèves on parle. Garde-le avec le sujet.",explanationFr:"Les élèves du club est le sujet complet. Fabriquent est le verbe et des cerfs-volants le complément."},
 ],
};
const rows:readonly [string,string,string][]=[
 ["La relieuse","assemble","les pages"],
 ["Les plongeurs","inspectent","la coque"],
 ["Le concierge","remplace","une ampoule"],
 ["Ma partenaire","lance","le dé"],
 ["Les apprentis du club","mesurent","la planche"],
 ["Le bijoutier","polit","une bague"],
];
const production:TargetTeachingContent={
 id:"french-v3-teaching:canonical-sentence:production",nodeKey:"construction_phrase_canonique",mode:"production",status:"draft_requires_review",
 titleFr:"Remettre les groupes d’une phrase dans l’ordre",learnerQuestionFr:"Comment remettre « une nappe / déplie / Léa » dans l’ordre ?",
 steps:[
  {exampleFr:"une nappe / déplie / Léa → Léa déplie une nappe.",explanationFr:"Déplie est le verbe conjugué. Léa est son sujet : elle déplie. Une nappe indique ce qu’elle déplie. Place les trois groupes dans l’ordre sujet, verbe, complément."},
  {exampleFr:"les lampions / accrochent / Les organisateurs → Les organisateurs accrochent les lampions.",explanationFr:"Déplace des groupes entiers. Les organisateurs forme le sujet, et les lampions forme le complément. Les mots à l’intérieur de ces groupes gardent leur ordre."},
  {exampleFr:"un seau / transporte / La voisine du dessus → La voisine du dessus transporte un seau.",explanationFr:"Un groupe sujet peut être long. Du dessus précise quelle voisine : garde cette précision avec La voisine, avant le verbe."},
 ],
 takeawayFr:"Trouve le verbe, puis le groupe sujet et le complément du verbe. Remets les groupes dans l’ordre demandé sans ajouter ni enlever de mots, puis relis la phrase entière.",
 boundaryFr:"Cet entraînement donne déjà tous les groupes et demande un ordre précis. Il ne suffit pas à montrer que tu sais inventer une phrase ou écrire un texte. D’autres constructions françaises peuvent avoir un autre ordre.",
 practice:rows.map(([subject,verb,object],index)=>({id:`canonical-production-guide-${index+1}`,promptFr:`Remets ces groupes dans l’ordre sujet, verbe, complément. Recopie la phrase entière sans ajouter de mots.\n\n${object} / ${verb} / ${subject}`,answerFr:`${subject} ${verb} ${object}.`,hintFr:`Le verbe est ${verb}. Cherche le groupe qui peut être placé devant lui comme sujet.`,explanationFr:`${subject} est le sujet, ${verb} le verbe et ${object} son complément. On conserve chaque groupe entier.`})),
};
export const CANONICAL_SENTENCE_TEACHING:readonly TargetTeachingContent[]=[recognition,production].map(lesson=>({...lesson,materialExposure:{sentences:[...lesson.steps.map(step=>step.exampleFr),...lesson.practice.flatMap(exercise=>[exercise.promptFr,exercise.answerFr,...(exercise.choices??[])])]}}));
