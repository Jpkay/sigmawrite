import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {TargetAnnotation} from "./facet-adapter";

type Item=CanonicalDiagnosticBankItem["item"];
type Exposure={sentences?:string[];assessed?:{sentences?:string[];words?:string[]};[key:string]:unknown};

function invariant(value:unknown,message:string):asserts value{
 if(!value)throw Error(`Revision 45 copy source mismatch: ${message}`);
}

function rewriteExposure(item:Item,replacements:readonly {before:string;after:string;occurrences:number}[]):Item{
 const raw=item.validatorConfig?.materialExposure;
 invariant(raw&&typeof raw==="object"&&!Array.isArray(raw),`${item.nodeKey}: material exposure`);
 const exposure=raw as Exposure,seen=new Map(replacements.map(row=>[row.before,0]));
 const rewrite=(values:readonly string[]|undefined)=>values?.map(value=>{
  const replacement=replacements.find(row=>row.before===value);
  if(!replacement)return value;
  seen.set(value,(seen.get(value)??0)+1);return replacement.after;
 });
 const sentences=rewrite(exposure.sentences);
 const assessed=exposure.assessed?{...exposure.assessed,sentences:rewrite(exposure.assessed.sentences)}:undefined;
 for(const row of replacements)invariant(seen.get(row.before)===row.occurrences,`${item.nodeKey}: material exposure text ${row.before}`);
 return {...item,validatorConfig:{...item.validatorConfig,materialExposure:{...exposure,...(sentences?{sentences}:{}),...(assessed?{assessed}:{})}}};
}

const DIRECT_OBJECT_CHOICES:Readonly<Record<string,{sourceChecksum:string;question:string;choices:readonly [string,string,string,string]}>>={
 "v3-direct-object:manga":{sourceChecksum:"sha256:12855f2dddf25c2729430a54301ffe70350cb3db02cc80fd4f3ba3df37185838",question:"Quel groupe répond directement à « Lina lit quoi ? »",choices:["un manga","Lina","lit","Aucun"]},
 "v3-direct-object:person":{sourceChecksum:"sha256:a684de47345f931c6399677523b99479de47ccc0c75f80b121d5341916b1fe01",question:"Quel groupe répond directement à « Le médecin examine qui ? »",choices:["le joueur","Le médecin","examine","Aucun"]},
 "v3-direct-object:time":{sourceChecksum:"sha256:e92bab8d3800d7bbd8bb86fc6747bbf43fc6509d8e42c744ce8198e7a121b143",question:"Quel groupe répond directement à « Nour prépare quoi ? »",choices:["son sac","Chaque matin","Nour","Aucun"]},
 "v3-direct-object:recipient":{sourceChecksum:"sha256:302a71dfbd3dced0e437e9bfccb8d43bc936bbf272c3408943bd30827531bbb2",question:"Quel groupe répond directement à « Sami prête quoi ? »",choices:["sa règle","à Inès","Sami","Aucun"]},
 "v3-direct-object:place":{sourceChecksum:"sha256:bb033b8272767d0688194ccb6d717f61fc923f7057e1db92d4e5f79cc5ecedc8",question:"Quel groupe répond directement à « Les élèves ramassent quoi ? »",choices:["les feuilles","Dans la cour","les élèves","Aucun"]},
 "v3-direct-object:negative":{sourceChecksum:"sha256:3c1634d80373b4907ef82c40a2c9abbd6315f044ada09036a1cbb0c00fbb0ae8",question:"Quel groupe répond directement à « Nous ne regardons pas quoi ? »",choices:["cette émission","pas","Nous","Aucun"]},
 "v3-direct-object:question":{sourceChecksum:"sha256:50ca1ea52fd9ab46be8b4876d6b699b640855d3b043193c09bd6d5595d5ceb7f",question:"Quel groupe répond directement à « Tu préfères quoi ? »",choices:["Quel dessin","tu","préfères","Aucun"]},
 "v3-direct-object:noun-group":{sourceChecksum:"sha256:b1a42f2363a255f951796355a310ea9eeb8336b4180f460c78fa6b7ea4a4d576",question:"Quel groupe complet répond directement à « Le vent secoue quoi ? »",choices:["les branches du vieux chêne","du vieux chêne","Le vent","Aucun"]},
 "v3-direct-object:listen":{sourceChecksum:"sha256:a2ecf9ebca0dc858b826bfe308d5248cafcdf7b35dede645a6eade3f7afd2d8c",question:"Quel groupe répond directement à « Les enfants écoutent qui ? »",choices:["leur grand-mère","Les enfants","écoutent","Aucun"]},
 "v3-direct-object:quantity":{sourceChecksum:"sha256:b978cd858650b66157f2f0a5c09aa4ed96f6a9d24031ca89e4ef86df2f1472f2",question:"Quel groupe complet répond directement à « La boulangère vend quoi ? »",choices:["trois croissants","trois","La boulangère","Aucun"]},
 "v3-direct-object:coordinated":{sourceChecksum:"sha256:7514994623943cc3f28bf01df3ad4c300b80ef01112163660045b158d45c098e",question:"Quel groupe complet répond directement à « Malik range quoi ? »",choices:["ses crayons et sa gomme","sa gomme","Malik","Aucun"]},
 "v3-direct-object:perfect":{sourceChecksum:"sha256:f66a3925c6532e5cde28ca12ccc74dcc4b18a6acaef0b61363d6c03eef7ca0f5",question:"Quel groupe répond directement à « Vous avez terminé quoi ? »",choices:["le puzzle","terminé","Vous","Aucun"]},
 "v3-direct-object:indirect-only":{sourceChecksum:"sha256:0fc27df6793471589cd69d3ed1df9bbcea40ae68cf65fb794f70d07dd2822bc0",question:"Quel groupe peut venir juste après « téléphone » sans « à » ? Choisis « Aucun » si aucun groupe ne forme une phrase correcte.",choices:["Aucun","son cousin","Zoé","téléphone"]},
 "v3-direct-object:sleep":{sourceChecksum:"sha256:96284a5ff436ce4d7d426d7ed25e54ad3762b27a62735317e0014f8fa39746fd",question:"Quel groupe peut venir juste après « dort » sans « dans » ? Choisis « Aucun » si aucun groupe ne forme une phrase correcte.",choices:["Aucun","sa chambre","Le bébé","dort"]},
 "v3-direct-object:attribute":{sourceChecksum:"sha256:89c53761119a27ea11fe2f2464105473d0ffa8c75af131c2aa3813f746b735c5",question:"Dans cette phrase, « célèbre » décrit la musicienne. La musicienne fait-elle quelque chose à une autre personne ou à une chose ? Choisis le groupe si oui, ou « Aucun » si non.",choices:["Aucun","célèbre","Cette musicienne","est"]},
 "v3-direct-object:provenance":{sourceChecksum:"sha256:97a1d48da53e01e5e11566ba0b3602927615f05a8678a9e663576ab92022858d",question:"Quel groupe peut venir juste après « arrive » sans « de » ? Choisis « Aucun » si aucun groupe ne forme une phrase correcte.",choices:["Aucun","Bruxelles","Le car","arrive"]},
};

const CANONICAL_PRODUCTION_PROMPT="Remets ces trois groupes dans l’ordre sujet, verbe, complément. Recopie la phrase complète sans ajouter de mots.";
const PLAIN_CANONICAL_PRODUCTION_PROMPT="Remets ces trois groupes dans l’ordre : d’abord qui fait l’action, puis ce qui se passe, puis sur qui ou quoi porte l’action. Recopie la phrase complète sans ajouter de mots.";

/** Apply student-facing copy only after every frozen source and annotation has
 * passed its original provenance checks. Expansion annotations are then
 * resigned against the revised item; source expansion envelopes stay intact. */
export function applyRevision45BankCopy(items:readonly CanonicalDiagnosticBankItem[],annotations:readonly TargetAnnotation[]){
 const next:CanonicalDiagnosticBankItem[]=items.map(entry=>({...entry,item:{...entry.item,choices:entry.item.choices?.map(choice=>({...choice}))}})),changed=new Set<string>();
 const index=new Map(next.map((entry,i)=>[entry.itemKey,i]));
 const update=(itemKey:string,rewrite:(item:Item)=>Item)=>{
  const i=index.get(itemKey);invariant(i!==undefined,itemKey);
  next[i]={...next[i],item:rewrite(next[i].item)};changed.add(itemKey);
 };

 const subjectEntries=next.filter(entry=>entry.itemKey.startsWith("v3-subject-identification:"));
 if(subjectEntries.length){
  invariant(subjectEntries.length===16,"subject-identification count");
  for(const entry of subjectEntries)update(entry.itemKey,item=>{
   const parts=item.promptFr.split("\n\n");
   invariant(parts.length===2&&/^Quel groupe de mots est le sujet du verbe « [^»]+ » \?$/.test(parts[1]),entry.itemKey);
   invariant(item.instructionsFr==="Choisis le groupe sujet complet.",`${entry.itemKey}: instructions`);
   return {...item,promptFr:`${parts[0]}\n\nDans cette phrase, quels mots disent qui ou ce qui fait l’action ? Choisis le groupe complet.`,instructionsFr:"Choisis une réponse."};
  });
 }

 update("review-draft-v1:identifier_sujet_verbe:receptive:core",item=>{
  invariant(item.promptFr==="Laquelle de ces phrases ne contient PAS de sujet inversé ?","legacy subject core");
  invariant(item.choices?.length===3&&item.choices.every(choice=>choice.feedbackFr),"legacy subject feedback");
  return {...item,promptFr:"Dans quelle phrase les mots qui indiquent qui fait l’action sont-ils placés avant le mot qui dit ce qui se passe ?",choices:item.choices.map(choice=>({...choice,feedbackFr:choice.correct?"Les mots « Les enfants », qui disent qui fait l’action, viennent avant « lisent », qui dit ce qui se passe.":"Les mots qui disent qui fait l’action viennent après le mot qui dit ce qui se passe."}))};
 });

 const referenceEntries=next.filter(entry=>/^v3-reference-foundations:production:(?:[1-9]|1[0-2])$/.test(entry.itemKey));
 if(referenceEntries.length){
  invariant(referenceEntries.length===12,"reference production count");
  for(const entry of referenceEntries)update(entry.itemKey,item=>{
   const match=item.promptFr.match(/^Remplace « ([^»]+) » par un pronom sujet\. Écris la phrase complète en gardant les autres mots\.\n\n([\s\S]+)$/);
   invariant(match,entry.itemKey);
   return {...item,promptFr:`Remplace « ${match[1]} » par il, elle, nous, vous, ils ou elles. Écris la phrase complète en gardant les autres mots.\n\n${match[2]}`};
  });
 }

 const canonicalEntries=next.filter(entry=>entry.itemKey.startsWith("v3-canonical-sentence:"));
 if(canonicalEntries.length){
  invariant(canonicalEntries.length===32,"canonical sentence count");
  for(const entry of canonicalEntries)update(entry.itemKey,item=>{
   if(entry.itemKey.includes(":production-")){
    invariant(item.promptFr.startsWith(`${CANONICAL_PRODUCTION_PROMPT}\n\n`),entry.itemKey);
    const prompt=item.promptFr.replace(CANONICAL_PRODUCTION_PROMPT,PLAIN_CANONICAL_PRODUCTION_PROMPT);
    return {...rewriteExposure(item,[{before:item.promptFr,after:prompt,occurrences:2}]),promptFr:prompt};
   }
   invariant(item.responseType==="mcq"&&item.choices?.length===4,entry.itemKey);
   const sentence=item.promptFr.split("\n\n");invariant(sentence.length===2&&sentence[1]==="Quelle analyse décrit cette phrase ?",entry.itemKey);
   const choices=item.choices;
   if(choices[0].text==="Il manque un verbe conjugué pour former une phrase verbale complète."){
    invariant([choices[1].text,choices[2].text,choices[3].text].join("|")==="Le sujet est placé après le verbe.|La phrase suit l’ordre sujet, verbe, complément.|Le complément est placé avant le sujet.",entry.itemKey);
    const text=["Il manque un mot qui dit ce qui se passe.","Les mots qui indiquent qui fait l’action sont placés après le mot qui dit ce qui se passe.","Cette suite de mots dit déjà clairement qui fait quoi.","Les mots qui indiquent sur qui ou quoi porte l’action sont placés avant ceux qui indiquent qui la fait."];
    return {...item,promptFr:`${sentence[0]}\n\nCette suite de mots dit-elle clairement qui fait quoi ?`,choices:choices.map((choice,i)=>({...choice,text:text[i]}))};
   }
   const parsed=choices[0].text.match(/^« ([^»]+) » est le sujet, « ([^»]+) » est le verbe et « ([^»]+) » est son complément\.$/);
   invariant(parsed,entry.itemKey);const [,actor,action,receiver]=parsed;
   invariant(choices[1].text===`« ${receiver} » est le sujet et « ${actor} » est le complément du verbe.`&&choices[2].text===`« ${action} » est le sujet et « ${actor} » est le verbe.`&&choices[3].text==="Il manque un verbe conjugué.",entry.itemKey);
   const text=[`« ${actor} » indique qui fait l’action, « ${action} » dit ce qui se passe et l’action porte sur « ${receiver} ».`,`« ${receiver} » indique qui fait l’action et l’action porte sur « ${actor} ».`,`« ${action} » indique qui fait l’action et « ${actor} » dit ce qui se passe.`,"Il manque le mot qui dit ce qui se passe."];
   return {...item,promptFr:`${sentence[0]}\n\nQui fait l’action, que se passe-t-il et sur qui ou quoi porte l’action ?`,choices:choices.map((choice,i)=>({...choice,text:text[i]}))};
  });
 }

 const presentEntries=next.filter(entry=>entry.itemKey.startsWith("v3-conjugation-foundation:present-"));
 if(presentEntries.length){
  invariant(presentEntries.length===10,"present recognition count");
  for(const entry of presentEntries)update(entry.itemKey,item=>{
   invariant(item.promptFr==="Quelle phrase contient un verbe au présent de l’indicatif ?",entry.itemKey);
   const prompt="Quelle phrase dit ce qui se passe maintenant ou d’habitude ?";
   return {...rewriteExposure(item,[{before:item.promptFr,after:prompt,occurrences:1}]),promptFr:prompt};
  });
 }

 const segmentEntries=next.filter(entry=>entry.itemKey.startsWith("v3-conjugation-foundation:segment-"));
 if(segmentEntries.length){
  invariant(segmentEntries.length===10,"verb segment count");
  for(const entry of segmentEntries)update(entry.itemKey,item=>{
   const match=item.promptFr.match(/^Dans « ([^»]+) », où séparer le radical et la terminaison \? Le radical est la base du verbe ; la terminaison est la fin qui change avec la personne et le temps\.$/);
   invariant(match,entry.itemKey);
   const prompt=`Dans « ${match[1]} », quelle barre sépare le début du verbe de sa fin ? Le début garde le sens principal ; la fin change selon qui fait l’action et le moment.`;
   return {...rewriteExposure(item,[{before:item.promptFr,after:prompt,occurrences:2}]),promptFr:prompt};
  });
 }

 const directEntries=next.filter(entry=>entry.itemKey.startsWith("v3-direct-object:"));
 if(directEntries.length){
  invariant(directEntries.length===16&&Object.keys(DIRECT_OBJECT_CHOICES).length===16,"direct-object count");
  for(const entry of directEntries)update(entry.itemKey,item=>{
   invariant(item.responseType==="mcq"&&item.choices?.length===4&&item.promptFr.endsWith("\n\nQuelle analyse du complément d’objet direct (COD) est correcte ?"),entry.itemKey);
   const rewrite=DIRECT_OBJECT_CHOICES[entry.itemKey];invariant(rewrite&&checksum(item.choices)===rewrite.sourceChecksum,`${entry.itemKey}: choices`);
   const replacements=item.choices.map((choice,i)=>({before:choice.text,after:rewrite.choices[i],occurrences:1}));
   const exposed=rewriteExposure(item,replacements),sentence=item.promptFr.split("\n\n")[0];
   return {...exposed,promptFr:`${sentence}\n\n${rewrite.question}`,choices:item.choices.map((choice,i)=>({...choice,text:rewrite.choices[i]}))};
  });
 }

 const adjectiveEntries=next.filter(entry=>/^v3-written-adjective:production-(?:17|18|19|20)$/.test(entry.itemKey));
 if(adjectiveEntries.length){
  invariant(adjectiveEntries.length===4,"written adjective count");
  for(const entry of adjectiveEntries)update(entry.itemKey,item=>{
   const match=item.promptFr.match(/^Complète avec « ([^»]+) » correctement accordé\. Écris seulement l’adjectif\.\n\n([\s\S]+)$/);
   invariant(match&&item.instructionsFr==="Écris seulement l’adjectif accordé.",entry.itemKey);
   return {...item,promptFr:`Complète avec la bonne forme de « ${match[1]} ». Écris seulement le mot manquant.\n\n${match[2]}`,instructionsFr:"Écris seulement le mot manquant."};
  });
 }

 const completiveEntries=next.filter(entry=>/^v3-completive-production:(?:1|10|11|12)$/.test(entry.itemKey));
 if(completiveEntries.length){
  invariant(completiveEntries.length===4,"completive production count");
  for(const entry of completiveEntries)update(entry.itemKey,item=>{
   const match=item.promptFr.match(/^Écris une seule phrase qui donne le contenu de ce qui est pensé, dit, appris ou constaté\. Commence par « ([^»]+) »\. Ajoute la proposition ci-dessous en choisissant le lien qui convient : que, qui, quand ou parce que\. Garde les autres mots dans leur ordre\. Adapte la majuscule et l’apostrophe si nécessaire\.\n\n([\s\S]+)$/);
   invariant(match,entry.itemKey);
   return {...item,promptFr:`Écris une seule phrase avec les deux idées. Commence par « ${match[1]} ». Choisis le mot qui les relie parmi que, qui, quand ou parce que. Garde les autres mots dans l’ordre. Adapte la majuscule et l’apostrophe si nécessaire.\n\n${match[2]}`};
  });
 }

 const agreementEntries=next.filter(entry=>entry.itemKey.startsWith("v3-agreement:additional-"));
 if(agreementEntries.length){
  invariant(agreementEntries.length===24,"additional agreement count");
  for(const entry of agreementEntries)update(entry.itemKey,item=>{
   const match=item.promptFr.match(/^Complète avec le verbe « ([^»]+) » au présent\.\n\n([\s\S]+)$/);
   invariant(match,entry.itemKey);
   return {...item,promptFr:`Complète avec « ${match[1]} » pour dire ce qui se passe maintenant ou d’habitude.\n\n${match[2]}`};
  });
 }

 const passive=next.find(entry=>entry.itemKey==="v3-passive-production:10");
 if(passive)update(passive.itemKey,item=>{
  const before="Réécris cette phrase à la voix passive, au même temps (imparfait). Commence par « La mélodie » et termine par « par les musiciens ». Garde les mêmes informations. Écris la phrase complète.";
  invariant(item.promptFr.startsWith(`${before}\n\n`),passive.itemKey);
  const after="Réécris la phrase en commençant par « La mélodie » et en terminant par « par les musiciens ». Garde les mêmes informations et le même moment dans le passé. Écris la phrase complète.";
  return {...item,promptFr:item.promptFr.replace(before,after)};
 });

 const changedEntries=new Map(next.filter(entry=>changed.has(entry.itemKey)).map(entry=>[entry.itemKey,entry]));
 const annotationCount=new Map<string,number>();
 const revisedAnnotations=annotations.map(annotation=>{
  const entry=changedEntries.get(annotation.itemKey);if(!entry)return annotation;
  annotationCount.set(annotation.itemKey,(annotationCount.get(annotation.itemKey)??0)+1);
  return {...annotation,itemChecksum:checksum(entry)};
 });
 for(const itemKey of changed){
  const expected=itemKey.startsWith("v3-")?1:0;
  invariant((annotationCount.get(itemKey)??0)===expected,`${itemKey}: annotation count`);
 }
 return {items:next,annotations:revisedAnnotations,changedItemKeys:[...changed].sort()};
}
