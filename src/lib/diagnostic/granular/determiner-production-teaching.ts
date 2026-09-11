import type {TargetTeachingContent} from "./teaching-content";
const exercises:Array<[string,string,string,string]>=[
 ["La nuage cache le soleil.","La","Le","Nuage est masculin singulier; garde l’article défini et écris le."],
 ["Un cabane se trouve au fond du jardin.","Un","Une","Cabane est féminin singulier; l’article indéfini devient une."],
 ["Ce écharpe est douce.","Ce","Cette","Écharpe est féminin singulier : cette écharpe. Cet est une forme masculine."],
 ["Cette aquarium est très grand.","Cette","Cet","Aquarium est masculin singulier et commence par une voyelle : cet aquarium."],
 ["Mon chaussures sont couvertes de boue.","Mon","Mes","Chaussures est pluriel. Garde la personne qui possède : mon devient mes."],
 ["Tes veste est accrochée ici.","Tes","Ta","Veste est féminin singulier. Garde la deuxième personne : tes devient ta."],
 ["Votre voisins sont absents.","Votre","Vos","Voisins est pluriel : vos voisins. Le nombre des personnes à qui l’on parle ne suffit pas à déterminer cette forme."],
 ["Leurs chien joue dehors.","Leurs","Leur","Chien est singulier : leur chien, même si plusieurs personnes le possèdent."],
];
const lesson:TargetTeachingContent={id:"french-v3-teaching:determiner-production",nodeKey:"construction_accord_determinant_nom",mode:"production",status:"draft_requires_review",
 titleFr:"Corriger le déterminant",learnerQuestionFr:"Le nom est correct : quel déterminant faut-il écrire devant lui ?",
 steps:[
 {exampleFr:"À corriger : Les vélo est rouge.\nCorrection : Le vélo est rouge.",explanationFr:"On te demande de garder le nom vélo, masculin singulier. Les appartient à la famille de le, la, l’, les. Choisis la forme qui convient au nom : le. Écris seulement ce déterminant, sans transformer vélo en vélos."},
 {exampleFr:"À corriger : Un assiettes sont propres.\nCorrection : Des assiettes sont propres.",explanationFr:"Assiettes est pluriel. Dans la famille de un et une, la forme plurielle est des. Les pourrait former un groupe grammatical, mais changerait la famille demandée et le sens; ici, la correction attendue est des."},
 {exampleFr:"À corriger : Ce oiseau se pose.\nCorrection : Cet oiseau se pose.",explanationFr:"Oiseau est masculin singulier et commence par une voyelle : ce devient cet. Au féminin singulier, on emploie cette; au pluriel, ces. Il faut tenir compte à la fois du nom et de la forme du déterminant."},
 {exampleFr:"À corriger : Mes bonnet est neuf.\nCorrection : Mon bonnet est neuf.",explanationFr:"Bonnet est masculin singulier. Mes indique un lien avec la personne qui parle; garde ce lien et écris mon. Son serait grammatical devant bonnet, mais désignerait une autre personne qui possède."},
 ],
 takeawayFr:"Trouve le nom concerné et garde-le tel quel. Vérifie son nombre et son genre, puis choisis la forme dans la même famille que le déterminant à corriger. Avec un possessif, garde aussi la personne qui possède.",
 boundaryFr:"Cette correction guidée par une consigne ne prouve pas encore l’accord spontané dans un texte libre. Attention à l’élision, comme l’école, et aux formes mon amie, ton adresse ou son idée devant une voyelle. Le genre du nom n’est pas toujours visible dans sa terminaison; dans un cas inconnu, il faut le vérifier.",
 practice:exercises.map(([sentence,marked,answerFr,explanationFr],index)=>({id:`determiner-production-guide-${index+1}`,promptFr:`${sentence}\n\nCorrige seulement « ${marked} ». Garde la même famille et la même personne qui possède. Écris uniquement le déterminant corrigé.`,answerFr,hintFr:"Repère le nom, son genre et son nombre. Ne change ni ce nom ni la famille du déterminant.",explanationFr})),
};
export const DETERMINER_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=[{...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(step=>step.exampleFr.split("\n").map(line=>line.replace(/^(À corriger|Correction) : /,""))),...exercises.map(([sentence])=>sentence)]}}];
