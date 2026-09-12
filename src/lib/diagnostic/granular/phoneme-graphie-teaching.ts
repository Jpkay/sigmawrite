import type {TargetTeachingContent} from './teaching-content';
import {parseAudioStimulus,type AudioStimulus} from './audio-stimulus';
import {PHONEME_GRAPHIE_TEACHING_WORDS, type PhonemeGraphieGroup} from './phoneme-graphie-drafts';
const groups:readonly PhonemeGraphieGroup[]=['ch','ou','gn','f'];
/** Bind fixed audio from the authoring manifest without exposing its transcript. */
export function buildPhonemeGraphieTeaching(assets:readonly {word:string;audioStimulus:AudioStimulus}[]):readonly TargetTeachingContent[]{
 const audioFor=(word:string)=>{
  const matches=assets.filter(row=>row.word===word);
  if(matches.length!==1)throw Error(`Missing or duplicate teaching audio: ${word}`);
  const audio=parseAudioStimulus(matches[0].audioStimulus);
  if(!audio)throw Error(`Missing teaching audio: ${word}`);
  return audio;
 };
 const examples=PHONEME_GRAPHIE_TEACHING_WORDS.filter((_,index)=>index%2===0);
 const practice=PHONEME_GRAPHIE_TEACHING_WORDS.filter((_,index)=>index%2===1);
 return (['recognition','production'] as const).map(mode=>({
  id:`french-v3-teaching:phoneme-graphie:${mode}`,nodeKey:'associer_phoneme_graphie_frequente',mode,status:'draft_requires_review',
  titleFr:mode==='recognition'?'Relier un son aux lettres du mot':'Compléter les lettres d’un mot entendu',
  learnerQuestionFr:'Quelles lettres correspondent au son que tu entends ?',
  steps:examples.map(([word,group])=>({exampleFr:`${word} → ${group}`,audioStimulus:audioFor(word),explanationFr:`Écoute « ${word} » en regardant le mot. Les lettres ${group} représentent le son que tu vas retrouver dans un autre mot. ${group.length>1?'Plusieurs lettres peuvent représenter un seul son.':'Ici, une seule lettre représente ce son.'}`})),
  practice:practice.map(([word,group],index)=>{
   const masked=word.replace(group,'___');
   return {id:`phoneme-graphie:${mode}:guided-${index}`,audioStimulus:audioFor(word),promptFr:`Écoute le mot, puis complète : ${masked}\n${mode==='recognition'?'Choisis le mot entendu.':'Écris le mot entier.'}`,...(mode==='recognition'?{choices:groups.map(g=>masked.replace('___',g))}:{}),answerFr:word,
    hintFr:'Réécoute le mot. Compare le son manquant aux exemples de la leçon : ch, ou, gn ou f.',explanationFr:`Le mot entendu est « ${word} ». À la place du blanc, on écrit ${group}.`};
  }),
  takeawayFr:'Écoute le mot, repère le son à la place du blanc, puis retrouve les lettres qui le représentent.',
  boundaryFr:'Cet entraînement porte sur ch, ou, gn et f dans quelques mots. Il ne vérifie pas tous les sons du français, les autres façons de les écrire, ni une dictée complète.',
  materialExposure:{words:PHONEME_GRAPHIE_TEACHING_WORDS.map(([word])=>({lemma:word,form:word}))},
 }));
}
