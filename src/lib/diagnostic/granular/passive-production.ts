import type {TargetTeachingContent} from './teaching-content';
export interface PassiveTransformation {active:string;subject:string;auxiliary:string;participle:string;agent:string;tense:'présent'|'imparfait'|'futur simple'}
const row=(active:string,subject:string,auxiliary:string,participle:string,agent:string,tense:PassiveTransformation['tense']):PassiveTransformation=>({active,subject,auxiliary,participle,agent,tense});
export const PASSIVE_PRODUCTION_ASSESSMENT:readonly PassiveTransformation[]=[
 row('Le gardien ferme le portail.','Le portail','est','fermé','le gardien','présent'),
 row('La couturière répare la veste.','La veste','est','réparée','la couturière','présent'),
 row('Les élèves rangent les dictionnaires.','Les dictionnaires','sont','rangés','les élèves','présent'),
 row('Le jury examine les affiches.','Les affiches','sont','examinées','le jury','présent'),
 row('Le vent emporte le chapeau.','Le chapeau','est','emporté','le vent','présent'),
 row('Les bénévoles distribuent la soupe.','La soupe','est','distribuée','les bénévoles','présent'),
 row('Le public applaudit les acteurs.','Les acteurs','sont','applaudis','le public','présent'),
 row('La bibliothécaire choisit les revues.','Les revues','sont','choisies','la bibliothécaire','présent'),
 row('Le capitaine dirigeait le navire.','Le navire','était','dirigé','le capitaine','imparfait'),
 row('Les musiciens jouaient la mélodie.','La mélodie','était','jouée','les musiciens','imparfait'),
 row('Le libraire vendait les romans.','Les romans','étaient','vendus','le libraire','imparfait'),
 row('Les jardiniers arrosaient les roses.','Les roses','étaient','arrosées','les jardiniers','imparfait'),
 row('L’arbitre vérifiera le ballon.','Le ballon','sera','vérifié','l’arbitre','futur simple'),
 row('La directrice ouvrira la réunion.','La réunion','sera','ouverte','la directrice','futur simple'),
 row('Les artistes peindront les murs.','Les murs','seront','peints','les artistes','futur simple'),
 row('Le guide décrira les sculptures.','Les sculptures','seront','décrites','le guide','futur simple'),
];
export const passiveSentence=(r:PassiveTransformation,auxiliary=r.auxiliary)=>`${r.subject} ${auxiliary} ${r.participle} par ${r.agent}.`;
export const passivePrompt=(r:PassiveTransformation)=>`Réécris cette phrase à la voix passive, au même temps (${r.tense}). Commence par « ${r.subject} » et termine par « par ${r.agent} ». Garde les mêmes informations. Écris la phrase complète.\n\n${r.active}`;
export const passiveAlternatives=(r:PassiveTransformation)=>{
 const auxiliaries=[r.auxiliary,...['est','sont','était','étaient','sera','seront'].filter(a=>a!==r.auxiliary).slice(0,3)];
 return auxiliaries.flatMap(a=>{const sentence=passiveSentence(r,a);return [sentence,sentence.slice(0,-1)];});
};
const guided:readonly PassiveTransformation[]=[
 row('La voisine nourrit le chat.','Le chat','est','nourri','la voisine','présent'),
 row('Le moniteur prépare la piste.','La piste','est','préparée','le moniteur','présent'),
 row('Les ouvriers réparaient les bancs.','Les bancs','étaient','réparés','les ouvriers','imparfait'),
 row('Le comité étudiait les demandes.','Les demandes','étaient','étudiées','le comité','imparfait'),
 row('Le professeur lira le message.','Le message','sera','lu','le professeur','futur simple'),
 row('La famille décorera les fenêtres.','Les fenêtres','seront','décorées','la famille','futur simple'),
];
export const PASSIVE_PRODUCTION_TEACHING:readonly TargetTeachingContent[]=[{
 id:'french-v3-teaching:passive:production',nodeKey:'construction_voix_passive',mode:'production',status:'draft_requires_review',titleFr:'Mettre une phrase à la voix passive',learnerQuestionFr:'Comment commencer par ce qui reçoit l’action ?',
 steps:[
 {exampleFr:'Le photographe prend la photo. → La photo est prise par le photographe.',explanationFr:'Repère ce que le photographe prend : la photo. Ce groupe devient le sujet. Au présent, on écrit est prise. Le photographe reste celui qui fait l’action, après par. Prise est le participe passé de prendre, accordé au féminin singulier avec la photo.'},
 {exampleFr:'Les enfants ramassaient les feuilles. → Les feuilles étaient ramassées par les enfants.',explanationFr:'On garde l’imparfait, mais on conjugue être avec le nouveau sujet les feuilles : étaient. Le participe passé ramassées s’accorde avec les feuilles, féminin pluriel. Le verbe actif ramassaient ne reste pas tel quel après être.'},
 {exampleFr:'Le technicien installera les micros. → Les micros seront installés par le technicien.',explanationFr:'Le temps reste le futur simple. Les micros est pluriel : on choisit seront, puis installés au masculin pluriel. Vérifie séparément le nouveau sujet, le temps d’être, le participe passé et la personne qui fait l’action.'},
 ],practice:guided.map((g,i)=>({id:`passive-production-guided-${i+1}`,promptFr:passivePrompt(g),answerFr:passiveSentence(g),hintFr:`Le nouveau sujet est ${g.subject.toLocaleLowerCase('fr')}. Garde le ${g.tense} et accorde le participe passé avec ce sujet.`,explanationFr:`${passiveSentence(g)} Être est au ${g.tense} et s’accorde avec ${g.subject.toLocaleLowerCase('fr')}. Le participe passé est ${g.participle}.`})),
 takeawayFr:'L’objet de la phrase active devient le sujet. Conjugue être au même temps avec ce nouveau sujet, accorde le participe passé et ajoute par suivi de celui qui fait l’action.',boundaryFr:'Ces phrases ont un complément direct qui peut devenir sujet. Tous les verbes ne permettent pas cette transformation. Cette tâche guidée par une consigne précise ne prouve pas encore que tu sais employer la voix passive dans un texte libre.',materialExposure:{sentences:[...guided.flatMap(g=>[g.active,passiveSentence(g)]),'Le photographe prend la photo.','La photo est prise par le photographe.','Les enfants ramassaient les feuilles.','Les feuilles étaient ramassées par les enfants.','Le technicien installera les micros.','Les micros seront installés par le technicien.']},
}];
