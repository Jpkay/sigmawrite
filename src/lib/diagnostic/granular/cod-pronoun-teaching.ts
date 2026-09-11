import type {TargetTeachingContent} from "./teaching-content";
type Kind="le"|"la"|"les"|"elision";
type Case=readonly [string,string,string];
const cases:Record<Kind,readonly Case[]>={
 le:[
 ["La guide déplie le plan.","le plan","La guide le déplie."],
 ["Sami répare son cerf-volant.","son cerf-volant","Sami le répare."],
 ["Nous remercions cet arbitre.","cet arbitre","Nous le remercions."],
 ["Tu découpes le carton.","le carton","Tu le découpes."],
 ["Les élèves recopient ce paragraphe.","ce paragraphe","Les élèves le recopient."],
 ["Ma tante ne vend pas son fauteuil.","son fauteuil","Ma tante ne le vend pas."],
 ],
 la:[
 ["Nina répare la fermeture.","la fermeture","Nina la répare."],
 ["Le vendeur pèse cette pastèque.","cette pastèque","Le vendeur la pèse."],
 ["Nous remercions notre entraîneuse.","notre entraîneuse","Nous la remercions."],
 ["Tu découpes la nappe.","la nappe","Tu la découpes."],
 ["Les élèves recopient cette adresse.","cette adresse","Les élèves la recopient."],
 ["Mon voisin ne vend pas sa guitare.","sa guitare","Mon voisin ne la vend pas."],
 ],
 les:[
 ["La guide déplie les cartes.","les cartes","La guide les déplie."],
 ["Sami répare ses patins.","ses patins","Sami les répare."],
 ["Nous remercions nos entraîneuses.","nos entraîneuses","Nous les remercions."],
 ["Tu découpes ces étiquettes.","ces étiquettes","Tu les découpes."],
 ["Les élèves apportent leurs instruments.","leurs instruments","Les élèves les apportent."],
 ["Ma tante ne vend pas ses chaises.","ses chaises","Ma tante ne les vend pas."],
 ],
 elision:[
 ["La guide examine le billet.","le billet","La guide l’examine."],
 ["Sami essuie sa visière.","sa visière","Sami l’essuie."],
 ["Nous accompagnons cet élève.","cet élève","Nous l’accompagnons."],
 ["Tu emportes cette boîte.","cette boîte","Tu l’emportes."],
 ["Les élèves effacent le schéma.","le schéma","Les élèves l’effacent."],
 ["Ma tante n’abandonne pas son projet.","son projet","Ma tante ne l’abandonne pas."],
 ],
};
const specs:Record<Kind,{title:string;question:string;steps:TargetTeachingContent['steps'];takeaway:string;boundary:string;hint:string;why:string}>={
 le:{title:"Remplacer un complément par le",question:"Comment éviter de répéter « le costume » dans « Emma repasse le costume » ?",
 steps:[
 {exampleFr:"Emma repasse le costume. → Emma le repasse.",explanationFr:"Le costume complète directement repasse, sans à ni de. C’est un complément d’objet direct, ou COD. Le remplace ici ce groupe masculin singulier et se place avant le verbe."},
 {exampleFr:"Le professeur félicite son élève. → Le professeur le félicite.",explanationFr:"Le peut aussi remplacer une personne. Ici, son élève désigne un garçon. Ce sont le rôle du groupe et son genre et son nombre qui guident le choix, pas la différence entre personne et objet."},
 {exampleFr:"Emma ne repasse pas le costume. → Emma ne le repasse pas.",explanationFr:"Dans cette phrase négative, le reste devant repasse. Ne vient avant le pronom et pas après le verbe."},
 ],takeaway:"Pour reprendre un COD masculin singulier devant une consonne, utilise le avant le verbe conjugué. Garde le sujet et retire tout le groupe remplacé.",boundary:"Ces exemples contiennent un seul verbe conjugué. Devant une voyelle, le devient l’. Les constructions avec un infinitif, les ordres et les compléments introduits par à demandent d’autres repères.",hint:"Le groupe est ici masculin singulier et complète directement le verbe. Place le avant le verbe.",why:"Le reprend le COD masculin singulier. Le sujet et la forme du verbe restent inchangés."},
 la:{title:"Remplacer un complément par la",question:"Comment éviter de répéter « la couverture » dans « Emma plie la couverture » ?",
 steps:[
 {exampleFr:"Emma plie la couverture. → Emma la plie.",explanationFr:"La couverture complète directement plie : c’est le complément d’objet direct, ou COD. La reprend ce groupe féminin singulier et se place avant le verbe."},
 {exampleFr:"Le professeur félicite sa collègue. → Le professeur la félicite.",explanationFr:"La peut reprendre une personne. Sa collègue est ici un groupe féminin singulier qui complète directement félicite."},
 {exampleFr:"Emma ne plie pas la couverture. → Emma ne la plie pas.",explanationFr:"La reste avant plie. Pour conserver la négation, place ne avant la et pas après le verbe."},
 ],takeaway:"Pour reprendre un COD féminin singulier devant une consonne, utilise la avant le verbe. Remplace le groupe entier, sans le répéter après le verbe.",boundary:"Ces exemples ont un seul verbe conjugué. Devant une voyelle, la devient l’. Le choix la ne dépend pas du genre du sujet : il dépend du groupe remplacé.",hint:"Le groupe remplacé est féminin singulier. Place la devant le verbe sans changer le sujet.",why:"La reprend le COD féminin singulier. On conserve le sujet et le verbe."},
 les:{title:"Remplacer plusieurs personnes ou objets par les",question:"Comment raccourcir « Emma plie les couvertures » ?",
 steps:[
 {exampleFr:"Emma plie les couvertures. → Emma les plie.",explanationFr:"Les couvertures est un complément d’objet direct, ou COD, au pluriel. Les remplace le groupe entier et se place avant le verbe."},
 {exampleFr:"Emma repasse les costumes. → Emma les repasse.",explanationFr:"Les reprend aussi bien un groupe masculin pluriel qu’un groupe féminin pluriel. Le genre ne change donc pas la forme les."},
 {exampleFr:"Emma apporte les couvertures. → Emma les apporte.",explanationFr:"Même devant une voyelle, les garde sa forme entière. On ne le réduit pas à l’. Le verbe reste au singulier parce que son sujet est toujours Emma."},
 {exampleFr:"Emma ne plie pas les couvertures. → Emma ne les plie pas.",explanationFr:"Les reste devant le verbe à la forme négative. Ne vient avant les et pas après le verbe."},
 ],takeaway:"Utilise les pour reprendre un COD pluriel, masculin ou féminin. Place-le avant le verbe, sans changer l’accord du verbe avec son sujet.",boundary:"Les reprend ici un complément direct. Pour un groupe comme à mes amis après parler, on n’utilise pas les. Les ordres et les groupes avec plusieurs verbes demandent un autre placement.",hint:"Le complément est pluriel. Place les avant le verbe, même s’il commence par une voyelle.",why:"Les reprend tout le COD pluriel. Il ne devient pas l’ et ne change pas le sujet du verbe."},
 elision:{title:"Utiliser l’ devant une voyelle",question:"Pourquoi écrit-on « Emma l’emballe » plutôt que « Emma le emballe » ?",
 steps:[
 {exampleFr:"Emma emballe le cadeau. → Emma l’emballe.",explanationFr:"Le cadeau est le complément d’objet direct, ou COD, masculin singulier. On le reprendrait par le, mais emballe commence par une voyelle : le devient l’. Ce raccourcissement s’appelle l’élision."},
 {exampleFr:"Emma emporte la caisse. → Emma l’emporte.",explanationFr:"La devient aussi l’ devant une voyelle. L’ peut donc reprendre un COD masculin singulier ou féminin singulier. L’apostrophe relie le pronom au verbe sans espace."},
 {exampleFr:"Emma emporte les caisses. → Emma les emporte.",explanationFr:"Au pluriel, on garde les. Le fait que le verbe commence par une voyelle ne transforme pas les en l’."},
 {exampleFr:"Emma n’emporte pas la caisse. → Emma ne l’emporte pas.",explanationFr:"Avec le pronom, ne est suivi de l’ et reprend sa forme entière. L’ reste collé au verbe emporte ; pas conserve sa place après le verbe."},
 ],takeaway:"Le et la deviennent l’ devant un verbe commençant par une voyelle. Les reste les. Garde le sujet et remplace tout le COD, sans le répéter.",boundary:"La même élision existe devant un h muet, mais pas devant un h aspiré. Cette leçon entraîne les voyelles. Elle ne couvre pas les accords du participe passé ni les phrases avec plusieurs pronoms.",hint:"Le COD est singulier et le verbe commence par une voyelle. Utilise l’ collé au verbe.",why:"L’ reprend le COD singulier devant la voyelle. L’apostrophe remplace la voyelle de le ou de la."},
};
export const COD_PRONOUN_TEACHING:readonly TargetTeachingContent[]=(Object.keys(specs) as Kind[]).map(kind=>{
 const spec=specs[kind];
 const lesson:TargetTeachingContent={id:`french-v3-teaching:cod-pronoun:${kind}`,nodeKey:"produire_pronom_cod",facetKey:`produire_pronom_cod::construction:${kind}`,mode:"production",status:"draft_requires_review",titleFr:spec.title,learnerQuestionFr:spec.question,steps:spec.steps,takeawayFr:spec.takeaway,boundaryFr:spec.boundary,
 practice:cases[kind].map(([source,target,answer],index)=>({id:`cod-${kind}-guide-${index+1}`,promptFr:`${source}\n\nRemplace seulement « ${target} » par le pronom qui convient. Recopie la phrase entière.`,answerFr:answer,hintFr:spec.hint,explanationFr:spec.why+(index===5?" La négation est conservée autour du groupe pronom-verbe.":"")}))};
 return {...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(step=>step.exampleFr.split(" → ")),...cases[kind].flatMap(([source,,answer])=>[source,answer])]}};
});
