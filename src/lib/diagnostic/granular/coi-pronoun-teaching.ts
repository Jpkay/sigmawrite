import type {TargetTeachingContent} from "./teaching-content";
type Case=readonly [string,string,string,string];
const singular:readonly Case[]=[
 ["La couturière répond à sa cliente.","à sa cliente","La couturière lui répond.","Répondre à quelqu’un : le groupe désigne une seule personne, donc lui."],
 ["Le voisin téléphone à son médecin.","à son médecin","Le voisin lui téléphone.","Téléphoner à quelqu’un : son médecin est une seule personne."],
 ["Mina prête sa règle à une camarade.","à une camarade","Mina lui prête sa règle.","Lui reprend à une camarade. Sa règle reste le complément qui désigne l’objet prêté."],
 ["Les scouts montrent leur carte au guide.","au guide","Les scouts lui montrent leur carte.","Au guide signifie à le guide : une seule personne. Leur carte reste dans la phrase."],
 ["La vétérinaire explique le traitement à mon oncle.","à mon oncle","La vétérinaire lui explique le traitement.","Le destinataire est une personne au singulier. Le traitement reste ce qui est expliqué."],
 ["Le capitaine ne répond pas à la journaliste.","à la journaliste","Le capitaine ne lui répond pas.","Lui reste entre ne et le verbe. La journaliste est féminin, mais le pronom indirect est toujours lui."],
];
const plural:readonly Case[]=[
 ["La couturière répond à ses clientes.","à ses clientes","La couturière leur répond.","Le groupe désigne plusieurs personnes : le pronom indirect est leur, sans s."],
 ["Le voisin téléphone à ses collègues.","à ses collègues","Le voisin leur téléphone.","Téléphoner à plusieurs personnes conduit à leur. Le sujet Le voisin ne change pas."],
 ["Mina prête sa règle à deux camarades.","à deux camarades","Mina leur prête sa règle.","Leur reprend à deux camarades. Sa règle reste l’objet prêté."],
 ["Les scouts montrent leur carte aux guides.","aux guides","Les scouts leur montrent leur carte.","Le premier leur est le pronom qui reprend aux guides. Dans leur carte, leur accompagne le nom carte."],
 ["La vétérinaire explique le traitement aux propriétaires.","aux propriétaires","La vétérinaire leur explique le traitement.","Aux propriétaires est pluriel. Leur reprend les destinataires ; le traitement reste dans la phrase."],
 ["Le capitaine ne répond pas aux journalistes.","aux journalistes","Le capitaine ne leur répond pas.","Leur garde sa place avant répond et ne prend pas de s, même pour plusieurs journalistes."],
];
const distinctions:readonly Case[]=[
 ["La bibliothécaire salue son collègue.","son collègue","La bibliothécaire le salue.","Saluer quelqu’un : complément direct masculin singulier, donc le."],
 ["La bibliothécaire écrit à son collègue.","à son collègue","La bibliothécaire lui écrit.","Écrire à quelqu’un : complément indirect singulier, donc lui."],
 ["Le photographe félicite ses modèles.","ses modèles","Le photographe les félicite.","Féliciter quelqu’un : complément direct pluriel, donc les, même pour des personnes."],
 ["Le photographe parle à ses modèles.","à ses modèles","Le photographe leur parle.","Parler à quelqu’un : complément indirect pluriel, donc leur."],
 ["La directrice accompagne sa remplaçante.","sa remplaçante","La directrice l’accompagne.","Accompagner quelqu’un : COD féminin singulier. La devient l’ devant accompagne."],
 ["La directrice répond à sa remplaçante.","à sa remplaçante","La directrice lui répond.","Répondre à quelqu’un : COI singulier. Lui reprend aussi une personne féminine."],
 ["L’entraîneur présente la recrue aux joueuses.","la recrue","L’entraîneur la présente aux joueuses.","La recrue est la personne présentée, COD féminin singulier. Aux joueuses reste inchangé."],
 ["L’entraîneur présente la recrue aux joueuses.","aux joueuses","L’entraîneur leur présente la recrue.","Aux joueuses désigne les destinataires, COI pluriel. La recrue reste le COD."],
];
const makePractice=(id:string,rows:readonly Case[])=>rows.map(([source,target,answer,why],index)=>({id:`${id}-${index+1}`,promptFr:`${source}\n\nRemplace seulement « ${target} » par le pronom qui convient. Recopie la phrase entière.`,answerFr:answer,hintFr:"Regarde comment le verbe se construit avec le groupe indiqué et combien de personnes ce groupe désigne.",explanationFr:why}));
const lessons:TargetTeachingContent[]=[
 {id:"french-v3-teaching:coi-pronoun:lui",nodeKey:"produire_pronom_coi_personne",facetKey:"produire_pronom_coi_personne::construction:lui",mode:"production",status:"draft_requires_review",titleFr:"Reprendre une personne avec lui",learnerQuestionFr:"Comment éviter de répéter « à la vendeuse » dans « Éva répond à la vendeuse » ?",
 steps:[
 {exampleFr:"Éva répond à la vendeuse. → Éva lui répond.",explanationFr:"Répondre se construit avec à quelqu’un. À la vendeuse est un complément d’objet indirect, ou COI. Lui reprend ici ce groupe qui désigne une seule personne et se place avant le verbe."},
 {exampleFr:"Éva répond au vendeur. → Éva lui répond.",explanationFr:"Au réunit à et le. Le groupe désigne cette fois un homme, mais le pronom reste lui. Pour cette construction, lui s’emploie au masculin comme au féminin."},
 {exampleFr:"Éva donne un ticket à la vendeuse. → Éva lui donne un ticket.",explanationFr:"On remplace seulement la personne destinataire. Un ticket reste dans la phrase : il désigne ce qu’Éva donne."},
 ],takeawayFr:"Avec les verbes étudiés, remplace à une personne par lui avant le verbe. Retire le groupe entier, y compris à, et conserve les autres compléments.",boundaryFr:"Ce remplacement ne convient pas automatiquement à tous les groupes avec à. Par exemple, on dit penser à elle, pas lui penser. Cette leçon porte sur répondre, téléphoner et les destinataires de donner, prêter, montrer ou expliquer.",practice:makePractice("coi-lui-guide",singular)},
 {id:"french-v3-teaching:coi-pronoun:leur",nodeKey:"produire_pronom_coi_personne",facetKey:"produire_pronom_coi_personne::construction:leur",mode:"production",status:"draft_requires_review",titleFr:"Reprendre plusieurs personnes avec leur",learnerQuestionFr:"Que devient « aux vendeuses » dans « Éva répond aux vendeuses » ?",
 steps:[
 {exampleFr:"Éva répond aux vendeuses. → Éva leur répond.",explanationFr:"Aux signifie à les. Le groupe désigne plusieurs personnes et complète indirectement répond : c’est un COI. Leur reprend ici tout ce groupe avant le verbe."},
 {exampleFr:"Éva répond aux vendeurs. → Éva leur répond.",explanationFr:"Leur ne change pas selon le genre des personnes. Le pronom s’écrit sans s, même si les personnes sont plusieurs."},
 {exampleFr:"Éva leur donne leurs tickets.",explanationFr:"Avant donne, leur remplace les destinataires et ne prend pas de s. Devant tickets, leurs accompagne un nom pluriel : ce n’est pas le même emploi."},
 ],takeawayFr:"Avec les verbes étudiés, utilise leur pour reprendre à plusieurs personnes. Le pronom leur reste sans s et se place avant le verbe.",boundaryFr:"Le nombre du pronom dépend des personnes remplacées, pas du sujet de la phrase. Tous les groupes introduits par à ne se remplacent pas par leur : penser à elles garde par exemple à.",practice:makePractice("coi-leur-guide",plural)},
 {id:"french-v3-teaching:pronoun:cod-coi-distinction",nodeKey:"distinguer_pronom_cod_coi",mode:"production",status:"draft_requires_review",titleFr:"Choisir entre le, la, les et lui, leur",learnerQuestionFr:"Pourquoi dit-on « Éva la salue », mais « Éva lui répond » ?",
 steps:[
 {exampleFr:"Éva salue la vendeuse. → Éva la salue.",explanationFr:"Saluer quelqu’un relie directement le verbe à la personne. La vendeuse est un COD. Comme ce groupe est féminin singulier, on le reprend par la."},
 {exampleFr:"Éva répond à la vendeuse. → Éva lui répond.",explanationFr:"Répondre demande à quelqu’un. À la vendeuse est un COI. On reprend cette personne singulière par lui. Le fait de désigner une personne ne suffit donc pas à choisir lui."},
 {exampleFr:"Éva salue les vendeuses. → Éva les salue.\nÉva répond aux vendeuses. → Éva leur répond.",explanationFr:"Au pluriel, le complément direct se reprend par les. Avec répondre à plusieurs personnes, le complément indirect se reprend par leur."},
 {exampleFr:"Éva remet le reçu à la vendeuse.",explanationFr:"Une phrase peut avoir les deux groupes : le reçu est ce qui est remis, à la vendeuse est la destinataire. Vérifie exactement quel groupe l’exercice te demande de remplacer."},
 ],takeawayFr:"Vérifie la construction du verbe et le groupe remplacé. Le, la, l’ ou les reprennent ici un COD ; lui ou leur reprennent les compléments de personne indirects étudiés.",boundaryFr:"À seul ne suffit pas à choisir lui ou leur pour tous les verbes. Ces exercices ne traitent ni les doubles pronoms, ni l’accord du participe passé, ni les reprises de lieux par y.",practice:makePractice("cod-coi-guide",distinctions)},
];
export const COI_PRONOUN_TEACHING:readonly TargetTeachingContent[]=lessons.map((lesson,index)=>({...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(step=>step.exampleFr.split(/\n| → /)),...[singular,plural,distinctions][index].flatMap(([source,,answer])=>[source,answer])]}}));
