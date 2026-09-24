import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {checksum} from "@/lib/taxonomy/validate";
import type {TargetAnnotation} from "./facet-adapter";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";

type Item=CanonicalDiagnosticBankItem["item"];
const fail=(key:string)=>{throw Error(`Revision 45 residual copy source mismatch: ${key}`);};

/** The reviewed base annotation file is first validated against the immutable
 * base bank. Only the in-memory revision 45 copy receives new item checksums. */
export function resignRevision45BaseAnnotations(annotations:readonly TargetAnnotation[],bank:CanonicalDiagnosticBankArtifact){
 const byKey=new Map(bank.items.map(entry=>[entry.itemKey,entry]));
 return annotations.map(annotation=>{
  const entry=byKey.get(annotation.itemKey);
  if(!entry)fail(annotation.itemKey);
  const itemChecksum=checksum(entry);
  return itemChecksum===annotation.itemChecksum?annotation:{...annotation,itemChecksum};
 });
}

function replaceExact(value:unknown,replacements:ReadonlyMap<string,string>):unknown{
 if(typeof value==="string")return replacements.get(value)??value;
 if(Array.isArray(value))return value.map(part=>replaceExact(part,replacements));
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,part])=>[key,replaceExact(part,replacements)]));
 return value;
}

function update(entry:CanonicalDiagnosticBankItem,prompt:string,choices?:readonly string[]):CanonicalDiagnosticBankItem{
 const source=entry.item,oldChoices=source.choices??[];
 if(choices&&choices.length!==oldChoices.length)fail(entry.itemKey);
 const replacements=new Map<string,string>([[source.promptFr,prompt]]);
 choices?.forEach((choice,index)=>replacements.set(oldChoices[index].text,choice));
 const item:Item={...source,promptFr:prompt};
 if(choices)item.choices=oldChoices.map((choice,index)=>({...choice,text:choices[index]}));
 if(source.correctAnswer)item.correctAnswer=replacements.get(source.correctAnswer)??source.correctAnswer;
 item.acceptableAnswers=source.acceptableAnswers.map(answer=>replacements.get(answer)??answer);
 if(source.validatorConfig)item.validatorConfig=replaceExact(source.validatorConfig,replacements) as Record<string,unknown>;
 return {...entry,item};
}

const TENSE_CUES:Readonly<Record<string,string>>={
 "passé récent":"avec une forme de « venir », puis « de » et le verbe, pour dire ce qui vient de se passer",
 "passé simple":"en un seul mot, comme « il dansa » dans un récit écrit",
 "imparfait":"pour parler d’une habitude ou d’une situation passée, comme « je chantais »",
 "subjonctif présent":"après « que » pour dire ici ce qui est souhaité, nécessaire ou possible",
 "passé composé":"avec « avoir » ou « être » suivi du verbe, comme dans « elle a chanté »",
 "plus-que-parfait":"avec « avoir » ou « être » pour dire qu’une action était déjà finie avant un autre moment passé, comme « elle avait chanté »",
 "conditionnel présent":"pour dire ce qui arriverait dans une situation imaginée, comme « je chanterais si… »",
 "futur simple":"en un seul mot pour dire ce qui se passera plus tard, comme « je chanterai »",
};
const FAMILY_TENSE:Readonly<Record<string,string>>={
 "v3-passe-recent-production:":"passé récent",
 "v3-passe-simple-verb-production:":"passé simple",
 "v3-passe-simple-family-production:":"passé simple",
 "v3-imparfait-family-production:":"imparfait",
 "v3-subjonctif-family-production:":"subjonctif présent",
 "v3-passe-compose-family-production:":"passé composé",
 "v3-plus-que-parfait-family-production:":"plus-que-parfait",
 "v3-conditionnel-family-production:":"conditionnel présent",
 "v3-futur-simple-family-production:":"futur simple",
};

const COMPUTED_COPY:Readonly<Record<string,string>>={
 "produire_imparfait:foundation":"Avec « je », écris « parler » pour parler d’une habitude passée, comme « je chantais ». Écris seulement le verbe.",
 "produire_imparfait:core":"Complète avec « manger » pour parler d’une habitude passée, comme « je chantais » : Nous ___ ensemble chaque dimanche. Écris seulement le verbe.",
 "produire_imparfait:stretch":"Réécris seulement le verbe de « ils voient » pour parler d’une habitude passée, comme « ils chantaient ».",
 "produire_passe_compose:foundation":"Avec « je », écris « parler » pour raconter une action terminée, avec « avoir » ou « être », comme « j’ai chanté ». Écris seulement les deux mots.",
 "produire_passe_compose:core":"Complète avec « venir » pour raconter une action terminée, avec « avoir » ou « être » : Elle ___ hier soir. Écris seulement le groupe qui manque.",
 "produire_passe_compose:stretch":"Réécris seulement le verbe de « ils prennent » pour raconter une action terminée, avec « avoir » ou « être », comme « ils ont chanté ».",
 "produire_futur_simple:foundation":"Avec « je », écris « parler » en un seul mot pour dire ce qui se passera plus tard, comme « je chanterai ». Écris seulement le verbe.",
 "produire_futur_simple:core":"Complète avec « finir » en un seul mot pour dire ce qui se passera plus tard, comme « je chanterai » : Vous ___ demain. Écris seulement le verbe.",
 "produire_futur_simple:stretch":"Réécris seulement le verbe de « ils viennent » en un seul mot pour dire ce qui se passera plus tard, comme « ils chanteront ».",
 "produire_plus_que_parfait:foundation":"Avec « je », écris « parler » pour dire qu’une action était déjà terminée avant un autre moment passé, comme « j’avais chanté ». Écris seulement les deux mots.",
 "produire_plus_que_parfait:core":"Complète avec « venir » pour dire qu’une action était déjà terminée avant un autre moment passé, comme « elle était partie » : Elle ___ avant midi. Écris seulement le groupe qui manque.",
 "produire_plus_que_parfait:stretch":"Réécris seulement le verbe de « ils prennent » pour dire qu’une action était déjà terminée avant un autre moment passé, comme « ils avaient chanté ».",
 "produire_conditionnel_present:foundation":"Avec « je », écris « parler » pour une situation imaginée, comme « je chanterais si… ». Écris seulement le verbe.",
 "produire_conditionnel_present:core":"Complète avec « finir » pour une situation imaginée, comme « je chanterais si… » : Nous ___ plus tôt. Écris seulement le verbe.",
 "produire_conditionnel_present:stretch":"Réécris seulement le verbe de « il vient » pour une situation imaginée, comme « il chanterait si… ».",
};

const TENSE_MEANING_FOCUS:Readonly<Record<string,readonly string[]>>={
 imperfect:["préparait","empruntions","lisaient","louait","était","portait","ressemblait","avait","dessinait","cherchions","discutaient","attachais"],
 future:["disparaîtra","atteindra","sera","augmentera","garderai","viendrai","rendrai","réparerons","visiterons","organiserons","utilisera","fabriquerez"],
 conditional:["installerions","apprendrait","découvrirais","pourraient","Pourriez","voudrais","Auriez","Accepteriez","fermerait","se trouveraient","aurait","préparerait"],
};

function rewriteTenseFamily(entry:CanonicalDiagnosticBankItem,tense:string){
 const escaped=tense.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const match=new RegExp(`^Complète avec ([^:]+?) (?:au |à l’)${escaped} : ([\\s\\S]+)$`,"u").exec(entry.item.promptFr);
 const expected={"passé récent":"passe_recent","passé simple":"passe_simple","imparfait":"imparfait","subjonctif présent":"subjonctif_present","passé composé":"passe_compose","plus-que-parfait":"plus_que_parfait","conditionnel présent":"conditionnel_present","futur simple":"futur_simple"}[tense];
 if(!match||entry.item.validatorType!=="conjugator"||entry.item.validatorConfig?.tense!==expected)fail(entry.itemKey);
 const verb=match![1],sentence=match![2];
 const prompt=tense==="passé récent"?`Pour dire ce qui vient de se passer, complète avec une forme de « venir », puis « de » et « ${verb} » : ${sentence}`:
  tense==="passé composé"?`Pour raconter une action terminée, complète avec « ${verb} » en utilisant « avoir » ou « être », comme dans « elle a chanté » : ${sentence}`:
  tense==="plus-que-parfait"?`Pour dire qu’une action était déjà finie avant un autre moment passé, complète avec « ${verb} » et « avoir » ou « être », comme « elle avait chanté » : ${sentence}`:
  `Complète avec « ${verb} » ${TENSE_CUES[tense]} : ${sentence}`;
 return update(entry,prompt);
}

function plainClauseChoice(text:string,kind:"completive"|"circonstancielle"|"relative"){
 const positiveCompletive=/^(« [^»]+ ») complète le verbe « ([^»]+) »\.$/u.exec(text);
 if(positiveCompletive)return `${positiveCompletive[1]} vient après « ${positiveCompletive[2]} » et dit ce qui est pensé, dit, vu ou souhaité.`;
 const positiveRelative=/^(« [^»]+ ») complète le nom « ([^»]+) »\.$/u.exec(text);
 if(positiveRelative)return `${positiveRelative[1]} ajoute une précision sur « ${positiveRelative[2]} ».`;
 const category=/^(« [^»]+ ») exprime (le temps|la cause|le but|une condition|une concession)\.$/u.exec(text);
 if(category){const description={"le temps":"dit quand cela se passe","la cause":"dit pourquoi cela se passe","le but":"dit dans quel but on agit","une condition":"dit ce qu’il faut pour que cela arrive","une concession":"dit ce qui n’empêche pas cela"}[category[2]];return `${category[1]} ${description}.`;}
 const replacements:Record<string,string>={
  "Cette phrase ne contient pas de proposition subordonnée complétive.":"Aucun groupe après un verbe ne dit ici ce qui est pensé, dit, vu ou souhaité.",
  "Cette phrase ne contient pas de proposition subordonnée circonstancielle.":"Aucun groupe ne dit ici quand, pourquoi, dans quel but, à quelle condition ou malgré quoi cela se passe.",
  "Cette phrase ne contient pas de proposition relative.":"Aucun groupe n’ajoute ici une précision sur une personne ou une chose.",
  "La phrase entière est une seule proposition subordonnée.":"Il faut choisir toute la phrase.",
  "La phrase entière est la proposition subordonnée recherchée.":"Il faut choisir toute la phrase.",
  "La phrase entière forme une seule proposition relative.":"Il faut choisir toute la phrase.",
  "La phrase entière est une proposition relative.":"Il faut choisir toute la phrase.",
  "Ce groupe est une relative qui précise un nom.":"Ce groupe ajoute une précision sur une personne ou une chose.",
  "Tout groupe de mots contenant que convient.":"Tout groupe avec « que » convient.",
  "Un groupe sans verbe conjugué suffit toujours.":"Un groupe sans verbe suffit toujours.",
  "Tout groupe introduit par que, quand ou lorsque est une relative.":"Tout groupe avec « que », « quand » ou « lorsque » ajoute une précision sur une personne ou une chose.",
  "La présence d’un verbe suffit pour reconnaître une relative.":"Un verbe suffit pour montrer qu’un groupe précise une personne ou une chose.",
 };
 if(replacements[text])return replacements[text];
 const singleWord=/^(« [^»]+ ») forme à lui seul la proposition relative\.$/u.exec(text);
 if(singleWord)return `${singleWord[1]} ajoute à lui seul une précision sur une personne ou une chose.`;
 if(kind==="relative"||kind==="completive"||kind==="circonstancielle")throw Error(`Unknown revision 45 clause choice: ${text}`);
 return text;
}

/** Student-facing instructions for revision 45 only. The caller must apply this
 * after source provenance checks and re-sign changed expansion annotations. */
export function rewriteRevision45ResidualItem(entry:CanonicalDiagnosticBankItem):CanonicalDiagnosticBankItem{
 const {itemKey,item}=entry;
 for(const [prefix,tense] of Object.entries(FAMILY_TENSE))if(itemKey.startsWith(prefix))return rewriteTenseFamily(entry,tense);
 if(itemKey.startsWith("computed-conjugation-v1:")){
  const suffix=itemKey.slice("computed-conjugation-v1:".length),prompt=COMPUTED_COPY[suffix];
  if(prompt){
   if(!item.promptFr.match(/imparfait|passé composé|futur simple|plus-que-parfait|conditionnel présent/u))fail(itemKey);
   return update(entry,prompt);
  }
 }
 if(itemKey.startsWith("v3-tense-meaning-foundations:")){
  const match=/^v3-tense-meaning-foundations:(imperfect|future|conditional)-(\d+)$/.exec(itemKey);
  if(!match||item.responseType!=="mcq")fail(itemKey);
  const index=Number(match![2])-1,focus=TENSE_MEANING_FOCUS[match![1]]?.[index];
  if(!focus||!item.promptFr.split("\n\n")[0].includes(focus)||!/À quoi sert ici (?:l’imparfait|le futur simple|le conditionnel présent) \?$/u.test(item.promptFr))fail(itemKey);
  const sentence=item.promptFr.split("\n\n")[0];
  return update(entry,`${sentence}\n\nQue montre ici la forme « ${focus} » ?`);
 }
 if(itemKey.startsWith("v3-relative-production:")){
  const before="Réunis ces deux phrases en une seule avec une proposition relative. Utilise qui, que, dont ou où. Garde tous les mots de la première phrase dans leur ordre, puis ajoute la relative à la place du point final. Dans la seconde phrase, remplace la répétition du nom par le pronom relatif adapté. N’ajoute pas d’autres informations.";
  if(!item.promptFr.startsWith(`${before}\n\n`))fail(itemKey);
  const after="Réunis les deux phrases en une seule avec qui, que, dont ou où. Garde les mots de la première phrase dans l’ordre. Après la personne ou la chose répétée, ajoute la précision de la seconde phrase en remplaçant les mots répétés. N’ajoute pas d’autres informations.";
  return update(entry,item.promptFr.replace(before,after));
 }
 if(itemKey.startsWith("v3-connected-writing:")){
  const replacements:readonly [RegExp,string][]=[
   [/Utilise le passé composé et l’imparfait\.$/u,"Pour les faits terminés, écris des formes comme « il a couru » ; pour le décor ou ce qui était en cours, des formes comme « il courait »."],
   [/Utilise le futur proche\.$/u,"Annonce ce qui va se passer avec une forme d’« aller » suivie d’un autre verbe, comme « nous allons jouer »."],
   [/en utilisant le futur proche\.$/u,"avec une forme d’« aller » suivie d’un autre verbe, comme « nous allons jouer »."],
   [/Utilise le passé récent\.$/u,"Pour raconter ce qui vient de se passer, utilise une forme de « venir », puis « de » et un autre verbe, comme « nous venons de jouer »."],
   [/Utilise le passé composé\.$/u,"Raconte les actions terminées avec des formes comme « elle a chanté » ou « elle est arrivée »."],
   [/au passé composé\.$/u,"avec des formes comme « elle a chanté » ou « elle est arrivée »."],
   [/, au passé composé\.$/u,", avec des formes comme « elle a chanté » ou « elle est arrivée »."],
   [/Utilise le futur simple\.$/u,"Pour les actions à venir, écris le verbe en un seul mot, comme « elle chantera »."],
   [/en utilisant le futur simple\.$/u,"en écrivant le verbe en un seul mot pour l’avenir, comme « elle chantera »."],
   [/, au futur simple\.$/u,", en écrivant le verbe en un seul mot pour l’avenir, comme « elle chantera »."],
   [/Utilise le plus-que-parfait pour ces préparatifs\.$/u,"Pour ces préparatifs déjà terminés avant la surprise, utilise des formes comme « elle avait préparé »."],
   [/Utilise le plus-que-parfait pour ces événements antérieurs\.$/u,"Pour ces événements déjà terminés avant son arrivée, utilise des formes comme « elle avait préparé »."],
   [/Utilise le plus-que-parfait pour ces actions antérieures\.$/u,"Pour ces actions déjà terminées avant l’ouverture, utilise des formes comme « elle avait préparé »."],
   [/, au conditionnel présent\.$/u,", avec des formes comme « elle construirait » pour cette situation imaginée."],
   [/Utilise le subjonctif présent dans des phrases reliées\.$/u,"Écris des phrases reliées pour exprimer ces souhaits et besoins, comme « Je souhaite qu’elle vienne »."],
   [/Utilise le subjonctif présent\.$/u,"Pour parler de ces souhaits et besoins, écris des phrases comme « Je souhaite qu’elle vienne »."],
   [/, en utilisant le subjonctif présent\.$/u,", avec des phrases comme « Je souhaite qu’elle vienne »."],
   [/Évite les répétitions en utilisant des pronoms\.$/u,"Évite de répéter les mêmes noms en utilisant il, elle, le, la, lui ou leur quand ils conviennent."],
   [/Utilise des pronoms pour éviter les répétitions\.$/u,"Évite de répéter les mêmes noms en utilisant il, elle, le, la, lui ou leur quand ils conviennent."],
   [/Utilise des pronoms pour éviter de répéter les mêmes noms\.$/u,"Évite de répéter les mêmes noms en utilisant il, elle, le, la, lui ou leur quand ils conviennent."],
  ];
  let prompt=item.promptFr;
  for(const [before,after] of replacements){if(before.test(prompt)){prompt=prompt.replace(before,after);break;}}
  if(prompt!==item.promptFr)return update(entry,prompt);
 }
 const localPrompts:Readonly<Record<string,{before:string;after:string;choices?:readonly string[]}>>={
  "review-draft-v1:former_participe_passe:controlled_production:foundation":{before:"Écris le participe passé du verbe « finir ».",after:"Écris la forme de « finir » qui vient après « avoir » ou « être », comme « choisi » après « a »."},
  "review-draft-v1:contraster_pc_imparfait:receptive:core":{before:"Complétez avec le passé composé ou l'imparfait : « Quand il _______ (arriver), nous _______ (dîner). »",after:"Choisis les deux formes qui racontent une arrivée terminée pendant que le dîner était en cours : « Quand il _______ (arriver), nous _______ (dîner). »"},
  "local-conjugation-gap-v1:interpreter_futur_proche:receptive:foundation":{before:"Dans « Le train va partir », que signale le futur proche ?",after:"Dans « Le train va partir », que veut dire « va partir » ?"},
  "local-conjugation-gap-v1:produire_passe_recent:controlled_production:core":{before:"Conjugue « partir » au passé récent avec « nous ». Écris seulement le groupe verbal.",after:"Avec « nous », écris une forme de « venir », puis « de » et « partir », pour dire que cela vient de se passer. Écris seulement les trois mots."},
  "local-conjugation-gap-v1:interpreter_imparfait:receptive:foundation":{before:"Dans « Chaque été, nous nagions », quelle valeur a l’imparfait ?",after:"Dans « Chaque été, nous nagions », que montre « nagions » ?"},
  "local-conjugation-gap-v1:interpreter_conditionnel_present:receptive:foundation":{before:"Dans « Je voyagerais si j’avais le temps », quelle valeur a le conditionnel ?",after:"Dans « Je voyagerais si j’avais le temps », que veut dire « voyagerais » ?",choices:["Ce qui se passerait si j’avais le temps.","Un fait certain.","Un ordre."]},
  "local-conjugation-gap-v1:reconnaitre_subjonctif_present:receptive:foundation":{before:"Quelle forme est au subjonctif présent ?",after:"Quelle réponse complète « Il faut ... » ?"},
  "local-conjugation-gap-v1:reconnaitre_subjonctif_present:receptive:stretch":{before:"Quelle forme verbale est au subjonctif présent ?",after:"Quelle réponse complète « Je souhaite ... » ?"},
 };
 const local=localPrompts[itemKey];
 if(local){if(item.promptFr!==local.before)fail(itemKey);return update(entry,local.after,local.choices);}
 if(itemKey.startsWith("v3-imperatif-verb-production:")||itemKey.startsWith("v3-imperatif-family-production:")||itemKey.startsWith("v3-vouloir-imperative:")){
  if(item.validatorType!=="conjugator"||item.validatorConfig?.tense!=="imperatif_present")fail(itemKey);
  const prompt=item.promptFr.replace(/Complète avec ([^:]+?) à l’impératif présent :/u,"Complète cette consigne avec « $1 » :");
  if(prompt===item.promptFr)fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("coverage-passe-recent-modal:")){
  const prompt=item.promptFr.replace(/^Le passé récent et le verbe sont imposés\. Complète avec ([^:]+) :/u,"Complète avec « $1 » en écrivant une forme de « venir », puis « de » et le verbe pour dire ce qui vient de se passer :");
  if(prompt===item.promptFr||item.validatorConfig?.tense!=="passe_recent")fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("v3-participle-formation:")){
  const prompt=item.promptFr.replace(/Complète avec le participe passé de « ([^»]+) »\. Écris seulement le mot manquant\./u,"Complète avec la forme de « $1 » qui vient après « avoir » ou « être ». Écris seulement le mot manquant.");
  if(prompt===item.promptFr)fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("v3-etre-participle-agreement:")){
  const prompt=item.promptFr.replace(/^Complète la phrase en accordant le participe passé\. Sa forme au masculin singulier est « ([^»]+) »\./u,"Complète avec la bonne forme du verbe. Si la phrase parlait d’un garçon seul, tu écrirais « $1 ». Adapte la fin du mot aux personnes ou aux choses dont on parle.");
  if(prompt===item.promptFr)fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("v3-avoir-participle-agreement:")){
  const prompt=item.promptFr.replace(/^Complète la phrase avec le participe passé de « ([^»]+) »\.\nForme au masculin singulier : ([^.]+)\./u,"Complète avec la bonne forme de « $1 » après « avoir ». La forme de départ est « $2 ». Adapte sa fin si la phrase le demande.");
  if(prompt===item.promptFr)fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("v3-passive-production:")&&itemKey!=="v3-passive-production:10"){
  const prompt=item.promptFr.replace(/^Réécris cette phrase à la voix passive, au même temps \((présent|imparfait|futur simple)\)\. Commence par («[^»]+») et termine par («[^»]+»)\. Garde les mêmes informations\. Écris la phrase complète\./u,(_full,tense:string,start:string,end:string)=>`Réécris la phrase en commençant par ${start} et en terminant par ${end}. Garde les mêmes informations et ${tense==="présent"?"le même moment, maintenant":tense==="imparfait"?"le même moment dans le passé":"le même moment à venir"}. Écris la phrase complète.`);
  if(prompt===item.promptFr)fail(itemKey);
  return update(entry,prompt);
 }
 if(itemKey.startsWith("v3-subordinate-clauses:")||itemKey.startsWith("v3-relative-clause:")){
  const kind=itemKey.startsWith("v3-relative-clause:")?"relative":itemKey.includes(":completive-")?"completive":"circonstancielle";
  const before=kind==="relative"?"Cette phrase contient-elle une proposition relative ? Choisis l’analyse correcte.":kind==="completive"?"Cette phrase contient-elle une proposition subordonnée complétive ? Choisis l’analyse correcte.":"Cette phrase contient-elle une proposition subordonnée circonstancielle ? Choisis l’analyse correcte.";
  const after=kind==="relative"?"Quel groupe ajoute une précision sur une personne ou une chose ? Choisis la réponse qui convient.":kind==="completive"?"Quel groupe vient après un verbe et dit ce qui est pensé, dit, vu ou souhaité ? Choisis la réponse qui convient.":"Quel groupe dit quand, pourquoi, dans quel but, à quelle condition ou malgré quoi cela se passe ? Choisis la réponse qui convient.";
  if(!item.promptFr.endsWith(before)||item.responseType!=="mcq"||!item.choices?.length)fail(itemKey);
  return update(entry,item.promptFr.slice(0,-before.length)+after,item.choices!.map(choice=>plainClauseChoice(choice.text,kind)));
 }
 if(itemKey.startsWith("v3-adjective-link:analysis-absence-")){
  const before="Quelle analyse de l’accord nom-adjectif est juste ?";
  if(!item.promptFr.endsWith(before)||item.choices?.length!==4)fail(itemKey);
  return update(entry,item.promptFr.slice(0,-before.length)+"Cette phrase contient-elle un mot qui décrit une personne ou une chose et change de forme avec elle ?",[
   "Non, aucun mot de cette phrase ne joue ce rôle.","Oui, le mot qui dit ce qui se passe joue ce rôle.","Oui, chaque mot après un nom joue ce rôle.","Oui, tous les mots prennent la forme du premier nom.",
  ]);
 }
 return entry;
}
