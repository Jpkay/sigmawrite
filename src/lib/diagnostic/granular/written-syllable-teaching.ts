import type {TargetTeachingContent} from './teaching-content';
const guided:readonly [string,string][]=[
 ['ra/dis','La consonne d commence la seconde syllabe écrite.'],
 ['pi/lo/te','Le e final reste dans une syllabe écrite, même quand on ne l’entend pas.'],
 ['ter/re','Les deux r sont séparés : ter/re.'],
 ['bot/te','Les deux t sont séparés : bot/te.'],
 ['ro/cher','Les lettres ch restent ensemble.'],
 ['su/cre','Le groupe cr commence la seconde syllabe écrite.'],
];
export const WRITTEN_SYLLABLE_TEACHING:readonly TargetTeachingContent[]=(['recognition','production'] as const).map(mode=>({
 id:`french-v3-teaching:written-syllables:${mode}`,nodeKey:'segmenter_syllabes_ecrites',mode,status:'draft_requires_review',
 titleFr:mode==='recognition'?'Repérer les syllabes écrites':'Découper un mot en syllabes écrites',
 learnerQuestionFr:'Comment découper un mot écrit sans perdre ses lettres ?',
 steps:[
  {exampleFr:'rôti → rô/ti',explanationFr:'La barre sépare les syllabes. Entre deux voyelles, une consonne seule commence la syllabe suivante. Ici, le t reste avec i.'},
  {exampleFr:'patate → pa/ta/te',explanationFr:'Nous découpons les syllabes écrites. Le e final forme ici une syllabe écrite, même si tu ne l’entends pas quand tu prononces le mot. Ne compte pas seulement les sons.'},
  {exampleFr:'casser → cas/ser',explanationFr:'Dans ce mot, on sépare les deux consonnes identiques : un s termine cas, et l’autre commence ser.'},
  {exampleFr:'acheter → a/che/ter ; zèbre → zè/bre',explanationFr:'Certains groupes restent ensemble : ch dans acheter et br dans zèbre. On ne coupe pas entre leurs deux lettres.'},
 ],
 practice:guided.map(([answerFr,explanationFr],i)=>{
  const word=answerFr.replaceAll('/',''),wrong=`${word[0]}/${word.slice(1)}`;
  return {id:`written-syllables:${mode}:guided-${i}`,promptFr:`Découpe le mot « ${word} » en syllabes écrites.${mode==='production'?' Sépare les syllabes par /.':''}`,...(mode==='recognition'?{choices:[answerFr,wrong,word]}:{}),answerFr,hintFr:'Garde toutes les lettres. Repère les voyelles, puis les consonnes seules, doubles ou groupées.',explanationFr};
 }),
 takeawayFr:'Découper en syllabes écrites aide à regarder l’intérieur du mot. Vérifie que toutes les lettres restent dans le même ordre.',
 boundaryFr:'On cherche ici les syllabes écrites de mots réguliers. Ce n’est ni un comptage des syllabes à l’oral, ni un exercice de coupure en fin de ligne. Les cas particuliers restent à apprendre.',
 materialExposure:{words:['rôti','patate','casser','acheter','zèbre',...guided.map(([word])=>word.replaceAll('/',''))].map(word=>({lemma:word,form:word}))},
}));
