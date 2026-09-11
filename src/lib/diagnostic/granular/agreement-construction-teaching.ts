import type {TargetTeachingContent} from "./teaching-content";
type Kind="adjacent"|"separated"|"inverted"|"coordinated";
type Case=readonly [string,string,string,string,boolean];
/** Guided material is separate from both agreement assessment expansions. */
const cases:Record<Kind,readonly Case[]>={
 adjacent:[
 ["La brodeuse ___ un motif.","La brodeuse","trace","tracent",false],
 ["Les passagères ___ leurs billets.","Les passagères","présentent","présente",true],
 ["Le serrurier ___ la serrure.","Le serrurier","lubrifie","lubrifient",false],
 ["Les cigales ___ dans les pins.","Les cigales","chantent","chante",true],
 ["La jongleuse ___ une quille.","La jongleuse","rattrape","rattrapent",false],
 ["Les déménageurs ___ le buffet.","Les déménageurs","déplacent","déplace",true],
 ["Le boulier ___ sur le bureau.","Le boulier","glisse","glissent",false],
 ["Les tisserandes ___ les fils.","Les tisserandes","croisent","croise",true],
 ],
 separated:[
 ["Le couvercle des marmites ___ doucement.","Le couvercle des marmites","vibre","vibrent",false],
 ["Les lumières du phare ___ les marins.","Les lumières du phare","guident","guide",true],
 ["La sonnerie des téléphones ___ la réunion.","La sonnerie des téléphones","interrompt","interrompent",false],
 ["Les tiroirs du meuble ___ facilement.","Les tiroirs du meuble","coulissent","coulisse",true],
 ["Le collier de perles ___ dans la boîte.","Le collier de perles","reste","restent",false],
 ["Les roues de la carriole ___ sur les pavés.","Les roues de la carriole","cahotent","cahote",true],
 ["La longueur des rubans ___ beaucoup.","La longueur des rubans","varie","varient",false],
 ["Les aiguilles du réveil ___ lentement.","Les aiguilles du réveil","tournent","tourne",true],
 ],
 inverted:[
 ["Sous les arches ___ une péniche.","une péniche","passe","passent",false],
 ["Devant le théâtre ___ des taxis.","des taxis","stationnent","stationne",true],
 ["Au fond des bois ___ une source.","une source","coule","coulent",false],
 ["Sur le tapis ___ des chatons.","des chatons","jouent","joue",true],
 ["Derrière les dunes ___ un phare.","un phare","apparaît","apparaissent",false],
 ["Dans la serre ___ des orchidées.","des orchidées","fleurissent","fleurit",true],
 ["Au-dessus des toits ___ une montgolfière.","une montgolfière","flotte","flottent",false],
 ["Près du bassin ___ des roseaux.","des roseaux","ondulent","ondule",true],
 ],
 coordinated:[
 ["Le luthier et son assistante ___ le violon.","Le luthier et son assistante","réparent","répare",true],
 ["La mangue et l’ananas ___ dans la corbeille.","La mangue et l’ananas","mûrissent","mûrit",true],
 ["Le libraire et la cliente ___ du roman.","Le libraire et la cliente","discutent","discute",true],
 ["Le froid et la neige ___ le départ.","Le froid et la neige","retardent","retarde",true],
 ["La chèvre et son chevreau ___ la prairie.","La chèvre et son chevreau","traversent","traverse",true],
 ["Le serveur et la cuisinière ___ les assiettes.","Le serveur et la cuisinière","comptent","compte",true],
 ["La radio et la télévision ___ la nouvelle.","La radio et la télévision","annoncent","annonce",true],
 ["Le maire et son adjointe ___ le ruban.","Le maire et son adjointe","coupent","coupe",true],
 ],
};
const models:Record<Kind,{name:string;question:string;steps:TargetTeachingContent['steps'];rule:string;boundary:string}>={
 adjacent:{name:"sujet juste avant le verbe",question:"Comment vérifier « La mosaïque brillent » ?",steps:[
 {exampleFr:"La mosaïque brillent. → La mosaïque brille.",explanationFr:"La mosaïque est le sujet. On peut le remplacer par elle, au singulier. Brillent est la forme du pluriel ; brille est la forme qui convient ici. C’est l’accord entre le sujet et le verbe."},
 {exampleFr:"Les mosaïques brillent.",explanationFr:"Cette fois, le sujet est pluriel et peut être remplacé par elles. La forme brillent est correcte. L’accord peut être visible à l’écrit même quand les formes se prononcent pareil."}],rule:"Repère le groupe sujet placé avant le verbe et vérifie s’il est singulier ou pluriel.",boundary:"Ces phrases sont au présent, à la troisième personne. Elles ne couvrent pas les autres temps, les sujets complexes ou tous les verbes irréguliers."},
 separated:{name:"mots entre le sujet principal et le verbe",question:"Dans « Le support des étagères cèdent », quel mot doit guider l’accord ?",steps:[
 {exampleFr:"Le support des étagères cèdent. → Le support des étagères cède.",explanationFr:"Le sujet entier est Le support des étagères. Support en est le mot principal, ou noyau : il est singulier. Le groupe des étagères précise ce qui est soutenu ; le mot étagères ne commande pas le verbe."},
 {exampleFr:"Les supports de cette étagère cèdent.",explanationFr:"Le noyau est maintenant supports, au pluriel. Tout le sujet se remplace par ils. Le nom étagère, plus proche du verbe, ne suffit pas pour choisir l’accord."}],rule:"Garde le sujet complet, puis retrouve son noyau. Un nom plus proche du verbe peut n’être qu’une précision.",boundary:"Ces exemples portent sur un groupe nominal avec une précision introduite par de. D’autres constructions, comme un sujet collectif, demandent une analyse supplémentaire."},
 inverted:{name:"sujet placé après le verbe",question:"Dans « Sous les ponts circulent un bateau », où est le sujet ?",steps:[
 {exampleFr:"Sous les ponts circulent un bateau. → Sous les ponts circule un bateau.",explanationFr:"Un bateau est le sujet, même s’il vient après le verbe. Remets mentalement les mots dans un ordre familier : un bateau circule sous les ponts. Le sujet est singulier, donc circule."},
 {exampleFr:"Sous le pont circulent des bateaux.",explanationFr:"Des bateaux est pluriel. Le groupe sous le pont indique un lieu et ne commande pas l’accord. Le sujet peut donc être éloigné et placé après le verbe."}],rule:"Cherche le sujet aussi après le verbe. Remets-le mentalement devant pour contrôler son nombre.",boundary:"Ces exemples sont des phrases déclaratives avec un lieu en tête. Ils ne couvrent pas toutes les questions ni les constructions interrogatives avec un pronom inversé."},
 coordinated:{name:"deux sujets réunis par et",question:"Pourquoi « Le violon et la harpe résonne » demande-t-il une correction ?",steps:[
 {exampleFr:"Le violon et la harpe résonne. → Le violon et la harpe résonnent.",explanationFr:"Deux instruments distincts forment ensemble le sujet. Le violon et la harpe peut être remplacé par ils. Le verbe est donc au pluriel : résonnent."},
 {exampleFr:"La harpe et le violon résonnent.",explanationFr:"Changer l’ordre des deux groupes ne change pas le pluriel. Il faut tenir compte du sujet entier, pas seulement du dernier nom placé devant le verbe."}],rule:"Quand et réunit ici deux sujets distincts, considère les deux ensemble et choisis le pluriel.",boundary:"Les exemples réunissent deux êtres ou choses distincts par et. Ils ne traitent pas les coordinations avec ou, ni les expressions où plusieurs mots désignent une seule réalité."},
};
export const AGREEMENT_CONSTRUCTION_TEACHING:readonly TargetTeachingContent[]=(Object.keys(models) as Kind[]).flatMap(kind=>(["recognition","production"] as const).map(mode=>{
 const model=models[kind],rows=cases[kind].slice(mode==="recognition"?0:4,mode==="recognition"?4:8);
 const lesson:TargetTeachingContent={id:`french-v3-teaching:agreement-construction:${kind}:${mode}`,nodeKey:"construction_accord_sujet_verbe",facetKey:`construction_accord_sujet_verbe::construction:${kind}`,mode,status:"draft_requires_review",titleFr:`${mode==="recognition"?"Expliquer l’accord":"Corriger l’accord"} : ${model.name}`,learnerQuestionFr:model.question,steps:model.steps,takeawayFr:model.rule,boundaryFr:model.boundary+(mode==="recognition"?" Choisir une explication ne prouve pas encore que tu sais corriger une phrase.":" Corriger une phrase donnée ne suffit pas à montrer que tu maîtrises l’accord dans un texte autonome."),
 practice:rows.map(([template,subject,correct,wrong,plural],index)=>{
  const valid=mode==="recognition"&&index%2===1,shown=template.replace("___",valid?correct:wrong),number=plural?"pluriel":"singulier";
  const explanation=`Le sujet entier est « ${subject} ». Il commande ici le ${number}. La forme attendue est « ${correct} ».`;
  const answer=valid?`L’accord est correct : le sujet commande le ${number}.`:`L’accord est incorrect : il faut écrire « ${correct} ».`;
  return {id:`agreement-construction-${kind}-${mode}-${index+1}`,promptFr:mode==="recognition"?`${shown}\n\nQuelle explication de l’accord est juste ?`:`${shown}\n\nCorrige seulement l’accord du verbe. Recopie la phrase entière sans changer les autres mots.`,...(mode==="recognition"?{choices:[answer,valid?`L’accord est incorrect : il faut écrire « ${wrong} ».`:"L’accord est correct : aucun changement n’est nécessaire.","Le verbe s’accorde toujours avec le nom le plus proche.","Le nombre du sujet ne change jamais la forme du verbe."]}:{}),answerFr:mode==="recognition"?answer:template.replace("___",correct),hintFr:model.rule,explanationFr:explanation};
 })};
 return {...lesson,materialExposure:{sentences:[...model.steps.flatMap(s=>s.exampleFr.split(" → ")),...lesson.practice.flatMap(p=>[p.promptFr.split("\n\n")[0],...(mode==="production"?[p.answerFr]:[])])]}};
}));
