import type {TargetTeachingContent} from "./teaching-content";
type Practice=[sentence:string,target:string,answer:string,hint:string,explanation:string];
type Draft={value:string;title:string;question:string;steps:Array<[string,string]>;takeaway:string;boundary:string;practice:Practice[]};
const drafts:Draft[]=[
 {value:"y_place",title:"Reprendre un lieu avec y",question:"Comment éviter de répéter « au musée » dans « Le groupe va au musée » ?",steps:[
 ["Le groupe va au musée. Le groupe y va.","Y reprend au musée. Ce petit mot permet de reparler du même lieu sans le nommer : c’est un pronom. Dans cette phrase, on le place avant va."],
 ["La couverture reste sur le canapé. La couverture y reste.","Y peut reprendre le lieu où quelque chose se trouve, pas seulement une destination. Ici, sur le canapé est remplacé par y."],
 ["Le groupe revient du musée. Le groupe en revient.","Attention au trajet : du musée indique d’où le groupe revient. Cette provenance se reprend avec en. Y correspond ici au lieu où l’on va ou où l’on est."],
 ],takeaway:"Pour reprendre un lieu où l’on est, où une action se passe ou vers lequel on va, emploie y avant le verbe dans ces phrases. Pour dire d’où l’on vient, vérifie plutôt en.",boundary:"Nous utilisons ici un seul verbe conjugué et un groupe de lieu. L’impératif, les infinitifs et les suites de plusieurs pronoms ont leurs propres règles de placement.",practice:[
 ["Les artistes répètent dans le studio.","dans le studio","Les artistes y répètent.","Dans le studio indique où se déroule la répétition.","Y reprend le lieu et se place avant répètent."],
 ["La tasse reste sur le plateau.","sur le plateau","La tasse y reste.","Le plateau est le lieu où reste la tasse.","Sur le plateau devient y; reste garde la même forme."],
 ["Vous attendez devant la pharmacie.","devant la pharmacie","Vous y attendez.","Cherche le lieu où vous attendez, pas une provenance.","Y reprend devant la pharmacie et précède attendez."],
 ["Tu conduis les enfants à la patinoire.","à la patinoire","Tu y conduis les enfants.","Garde les enfants : on remplace seulement la destination.","Y reprend à la patinoire. Les enfants reste le complément qui dit qui tu conduis."],
 ]},
 {value:"y_thing",title:"Reprendre une idée ou une chose avec y",question:"Dans « Elle réfléchit à ce choix », comment reprendre « à ce choix » ?",steps:[
 ["Elle réfléchit à ce choix. Elle y réfléchit.","Réfléchir se construit ici avec à. Le complément à ce choix désigne une chose abstraite, pas un lieu ni une personne. On peut le reprendre avec y."],
 ["Le club contribue à la rénovation. Le club y contribue.","Le lien à appartient à la construction contribuer à quelque chose. Y remplace tout le groupe à la rénovation, sans garder à devant le pronom."],
 ["Elle pense à son frère. Elle pense à lui.","Une personne demande une autre analyse. On ne remplace pas mécaniquement chaque groupe avec à par y. Ici, on dit à lui; avec d’autres verbes, on peut employer lui ou leur."],
 ],takeaway:"Quand le verbe se construit avec à + une chose ou une idée, y peut reprendre ce complément. Vérifie le verbe et ce que désigne le groupe.",boundary:"Cette leçon ne couvre pas les compléments humains ni toutes les constructions avec à. Une préposition seule ne suffit pas : il faut comprendre le lien avec le verbe.",practice:[
 ["Nous songeons à une autre solution.","à une autre solution","Nous y songeons.","Songer à quelque chose : le complément désigne une solution.","Y reprend à une autre solution et précède songeons."],
 ["La chorale participe à la cérémonie.","à la cérémonie","La chorale y participe.","Participer demande ici à; la cérémonie n’est pas une personne.","À la cérémonie devient y. Le verbe reste participe."],
 ["Tu renonces à cette récompense.","à cette récompense","Tu y renonces.","On renonce à quelque chose.","Y reprend le complément à cette récompense."],
 ["Le public s’intéresse à cette découverte.","à cette découverte","Le public s’y intéresse.","Garde le pronom se, qui devient s’ devant y.","Y reprend à cette découverte; se reste avec intéresse et s’élide : s’y intéresse."],
 ]},
 {value:"en_origin",title:"Reprendre le lieu d’où l’on vient avec en",question:"Comment raccourcir « Le cycliste revient du village » sans perdre son point de départ ?",steps:[
 ["Le cycliste revient du village. Le cycliste en revient.","Du village indique le lieu d’où il revient. En reprend ce lieu de provenance et se place avant revient."],
 ["Les ouvriers sortent de l’atelier. Les ouvriers en sortent.","De l’atelier est aussi un point de départ. On remplace tout le groupe par en, sans garder de l’ devant le pronom."],
 ["Les ouvriers entrent dans l’atelier. Les ouvriers y entrent.","Dans l’atelier indique ici la destination, pas le départ. C’est y qui reprend ce groupe. Le sens du déplacement aide à distinguer les deux."],
 ],takeaway:"En peut reprendre le lieu d’où l’on sort, revient ou s’éloigne, introduit par de, du, de la, de l’ ou des. Distingue le point de départ du lieu d’arrivée.",boundary:"Tous les groupes avec de ne sont pas des provenances. Dans parler de son travail, on indique un sujet de conversation; cet autre emploi de en est travaillé séparément.",practice:[
 ["Les nageurs sortent du bassin.","du bassin","Les nageurs en sortent.","Le bassin est le lieu qu’ils quittent.","En reprend du bassin et se place avant sortent."],
 ["Vous revenez de la montagne.","de la montagne","Vous en revenez.","De la montagne indique d’où vous revenez.","Le groupe de provenance devient en."],
 ["La voyageuse rentre du Portugal.","du Portugal","La voyageuse en rentre.","On garde rentre, et on reprend son point de départ.","En reprend du Portugal; le sujet et le verbe restent inchangés."],
 ["Le bateau s’éloigne du port.","du port","Le bateau s’en éloigne.","Garde se avec éloigne; il s’élide devant en.","Du port est repris par en. Se devient s’ : s’en éloigne."],
 ]},
 {value:"en_quantity",title:"Reprendre une quantité avec en",question:"Si « Elle prend deux biscuits » devient « Elle en prend… », que faut-il garder ?",steps:[
 ["Elle prend deux biscuits. Elle en prend deux.","En reprend les biscuits, mais le nombre deux reste exprimé. Sans deux, on perd une information donnée dans la première phrase."],
 ["Le peintre utilise de la peinture. Le peintre en utilise.","De la peinture désigne une quantité non précisée. En suffit ici : il n’y a pas de nombre à conserver."],
 ["Tu trouves une place. Tu en trouves une. Nous avons beaucoup de patience. Nous en avons beaucoup.","On garde une quand il s’agit d’une place. On garde aussi beaucoup : en ne remplace pas toute l’information de quantité."],
 ],takeaway:"Avec en, garde le nombre ou l’expression de quantité quand elle est précisée : un, une, trois, beaucoup, peu, assez. Avec du, de la ou de l’ sans quantité précise, en peut suffire.",boundary:"La quantité ne se traite pas comme un objet déjà défini : Je lis ce livre devient Je le lis. Cette leçon ne couvre pas les changements de quantité dans la négation ni l’accord du participe passé.",practice:[
 ["Nora dessine trois étoiles.","trois étoiles","Nora en dessine trois.","En reprend les étoiles; conserve le nombre trois.","Le nombre reste après dessine, tandis que en se place avant."],
 ["Nous commandons une pizza.","une pizza","Nous en commandons une.","Pizza est féminin; la quantité une reste exprimée.","On garde une pour conserver la quantité et le genre du nom repris."],
 ["Le jardinier verse de l’eau.","de l’eau","Le jardinier en verse.","Aucun nombre précis n’est indiqué.","En reprend de l’eau sans ajouter de quantité absente de la phrase."],
 ["Vous recevez beaucoup de messages.","beaucoup de messages","Vous en recevez beaucoup.","Garde beaucoup pour conserver l’information sur la quantité.","En reprend les messages, et beaucoup reste après le verbe."],
 ]},
 {value:"en_thing",title:"Reprendre un sujet ou une chose avec en",question:"Comment reprendre « de cette émission » dans « Nous parlons de cette émission » ?",steps:[
 ["Nous parlons de cette émission. Nous en parlons.","Parler de quelque chose : de cette émission indique le sujet de la conversation. En reprend ce groupe. Ce n’est ni un lieu de départ ni une quantité."],
 ["La troupe a besoin de ce décor. La troupe en a besoin.","Avoir besoin de quelque chose est une construction avec de. En remplace de ce décor et vient avant a; besoin reste dans la phrase."],
 ["Le témoin se souvient de cet événement. Le témoin s’en souvient.","On garde se avec le verbe se souvenir. Devant en, se s’écrit s’. En reprend de cet événement."],
 ],takeaway:"Repère la construction du verbe ou de l’expression : parler de, avoir besoin de, se souvenir de… En peut reprendre le complément non humain introduit par de.",boundary:"Il ne suffit pas de voir de pour choisir en : ce mot peut relier des groupes de plusieurs façons. Les compléments de personne et les constructions plus complexes demandent une analyse distincte.",practice:[
 ["Tu rêves de cette aventure.","de cette aventure","Tu en rêves.","Rêver de quelque chose : on reprend l’aventure.","En remplace de cette aventure et précède rêves."],
 ["Les habitantes discutent de la fermeture.","de la fermeture","Les habitantes en discutent.","La fermeture est le sujet de la discussion.","En reprend le complément de discutent introduit par de."],
 ["Nous avons besoin de ces outils.","de ces outils","Nous en avons besoin.","Garde besoin et place en avant avons.","En reprend de ces outils; l’expression avoir besoin reste présente."],
 ["La pilote se méfie de ce signal.","de ce signal","La pilote s’en méfie.","Se méfier reste pronominal; se devient s’ devant en.","En reprend de ce signal, et s’ reste avec méfie."],
 ]},
];
export const Y_EN_TEACHING:readonly TargetTeachingContent[]=drafts.map(draft=>({
 id:`french-v3-teaching:y-en:${draft.value}`,nodeKey:"produire_pronoms_y_en",facetKey:`produire_pronoms_y_en::construction:${draft.value}`,mode:"production",status:"draft_requires_review",
 titleFr:draft.title,learnerQuestionFr:draft.question,steps:draft.steps.map(([exampleFr,explanationFr])=>({exampleFr,explanationFr})),takeawayFr:draft.takeaway,boundaryFr:draft.boundary,
 practice:draft.practice.map(([sentence,target,answerFr,hintFr,explanationFr],index)=>({id:`y-en-guide:${draft.value}:${index+1}`,promptFr:`${sentence}\n\nRéécris avec y ou en à la place de « ${target} ». Garde les autres mots et la quantité précise, s’il y en a une.`,answerFr,hintFr,explanationFr})),
 materialExposure:{sentences:[...draft.steps.flatMap(([example])=>example.split(/(?<=[.!?])\s+/)),...draft.practice.flatMap(([sentence,,answer])=>[sentence,answer])]},
}));
