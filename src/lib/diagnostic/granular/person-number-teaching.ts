import type {TargetTeachingContent} from "./teaching-content";
import {PERSON_NUMBER_LABELS} from "./person-number-drafts";
const practice: Array<[string,string,number,string]> = [
 ["J’apporte les feutres.","J’",0,"J’ remplace je devant une voyelle : première personne du singulier."],
 ["Tu portes le sac.","Tu",1,"Tu désigne la personne à qui l’on parle : deuxième personne du singulier."],
 ["On travaille ensemble. Ici, on désigne mes amis et moi.","On",2,"On peut désigner notre groupe, mais il commande un verbe à la troisième personne du singulier."],
 ["Mon frère et moi cuisinons.","Mon frère et moi",3,"Le groupe comprend moi; on le remplace par nous : première personne du pluriel."],
 ["Monsieur, vous avez oublié votre écharpe.","vous",4,"Même pour un seul monsieur, le vous de politesse commande la deuxième personne du pluriel au verbe."],
 ["Les vélos restent dehors.","Les vélos",5,"Les vélos se remplace par ils : troisième personne du pluriel. Personne grammaticale ne signifie pas être humain."],
];
const lesson:TargetTeachingContent={
 id:"french-v3-teaching:person-number",nodeKey:"distinguer_personne_nombre",mode:"recognition",status:"draft_requires_review",
 titleFr:"Qui parle, à qui, et de qui ?",learnerQuestionFr:"Pourquoi dit-on je chante, tu chantes et nous chantons ?",
 steps:[
  {exampleFr:"Je chante. Tu danses. Elle filme.",explanationFr:"Je désigne la personne qui parle : première personne. Tu désigne celle à qui l’on parle : deuxième personne. Elle désigne celle dont on parle : troisième personne. Ici, les trois sujets sont au singulier."},
  {exampleFr:"Nous chantons. Vous dansez. Ils filment.",explanationFr:"Nous inclut la personne qui parle : première personne du pluriel. Vous désigne ceux à qui l’on parle : deuxième personne du pluriel. Ils et elles désignent ceux dont on parle : troisième personne du pluriel. Singulier et pluriel sont les deux nombres grammaticaux."},
  {exampleFr:"Le chien court. Les chiens courent. Toi et moi courons. Toi et Léa courez.",explanationFr:"Remplace le sujet par un pronom : le chien devient il; les chiens devient ils. Toi et moi devient nous, car moi fait partie du groupe. Toi et Léa devient vous : on s’adresse à toi, sans inclure moi. La personne grammaticale sert aussi pour les animaux et les objets."},
  {exampleFr:"On part ensemble. Madame, vous êtes attendue.",explanationFr:"Ne compte pas seulement les personnes réelles. On garde la troisième personne du singulier pour le verbe, même s’il signifie nous. Vous garde la deuxième personne du pluriel pour le verbe, même si l’on parle poliment à une seule dame. Dans le second exemple, êtes s’accorde avec vous; attendue est féminin singulier parce qu’il s’agit d’une seule dame."},
 ],
 takeawayFr:"Pour accorder le verbe, associe le sujet à je, tu, il/elle/on, nous, vous ou ils/elles. Vérifie à la fois sa personne et son nombre grammaticaux. Si le groupe comprend moi, pense à nous; s’il comprend toi sans moi, pense à vous.",
 boundaryFr:"Cette leçon te donne le sujet et t’aide à trouver ses traits pour le verbe. Elle ne vérifie pas encore que tu sais trouver le sujet dans toute phrase ni écrire toutes les formes du verbe. Avec on ou un vous de politesse, l’accord d’un adjectif ou d’un participe peut dépendre des personnes désignées; ne lui applique pas automatiquement le nombre du verbe.",
 practice:practice.map(([sentence,subject,index,explanationFr],i)=>({id:`person-number-guide-${i+1}`,promptFr:`${sentence}\n\nQuelle personne et quel nombre grammaticaux correspondent au sujet « ${subject} » pour le verbe ?`,choices:[...PERSON_NUMBER_LABELS],answerFr:PERSON_NUMBER_LABELS[index],hintFr:"Compare le sujet à je, tu, il/elle/on, nous, vous et ils/elles. Attention à on et au vous de politesse.",explanationFr})),
};
export const PERSON_NUMBER_TEACHING:readonly TargetTeachingContent[]=[{...lesson,materialExposure:{sentences:[...lesson.steps.flatMap(step=>step.exampleFr.split(/(?<=[.!?])\s+/)),...practice.map(([sentence])=>sentence)]}}];
