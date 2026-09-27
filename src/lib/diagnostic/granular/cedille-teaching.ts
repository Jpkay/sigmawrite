import type {TargetTeachingContent} from './teaching-content';
const cases:readonly [string,string,string][]=[
 ['limace','Une lima_e glisse sous une feuille.','Devant e, c donne déjà le son s.'],
 ['perçu','Elle a per_u un bruit au loin.','Devant u, ç conserve ici le son s.'],
 ['cacao','Le ca_ao sert à préparer le chocolat.','Le son attendu à cet endroit est k : garde c devant a.'],
 ['tronçon','Ce tron_on de route est fermé.','Devant o, il faut ici ç pour le son s.'],
 ['reçue','La lettre re_ue hier était signée.','Devant u, écris ç pour conserver le son s.'],
 ['cible','La flèche touche la _ible.','Devant i, c donne déjà le son s, sans cédille.'],
];
export const CEDILLE_TEACHING:readonly TargetTeachingContent[]=(['recognition','production'] as const).map(mode=>({
 id:`french-v3-teaching:cedille:${mode}`,nodeKey:'employer_cedille',mode,status:'draft_requires_review',titleFr:mode==='recognition'?'Repérer quand écrire ç':'Écrire c ou ç dans un mot',learnerQuestionFr:'Pourquoi écrit-on « une place », mais « nous plaçons » ?',
 steps:[
  {exampleFr:'une place → nous plaçons',explanationFr:'Dans les deux mots, la lettre c garde le son s. Mais la voyelle qui suit change. Devant o, le petit signe sous c, appelé cédille, permet de conserver ce son : ç.'},
  {exampleFr:'plaçait ; plaçons ; conçu',explanationFr:'Pour faire le son s devant a, o ou u avec la lettre c, on écrit ç. La cédille se place sous le c.'},
  {exampleFr:'place ; facile',explanationFr:'Devant e ou i, c fait déjà le son s. Il n’a pas besoin de cédille. N’en ajoute pas à ces mots.'},
  {exampleFr:'canard ; décor ; calcul',explanationFr:'Devant a, o ou u, c peut aussi faire le son k. Dans ce cas, garde c sans cédille. Regarder la voyelle seule ne suffit pas : il faut aussi reconnaître le mot et le son attendu.'},
 ],
 practice:cases.map(([answerFr,masked,why],i)=>{
  const letter=answerFr.includes('ç')?'ç':'c',wrong=masked.match(/[\p{L}]*_[\p{L}]*/u)![0].replace('_',letter==='ç'?'c':'ç');
  return {id:`cedille:${mode}:guided-${i}`,promptFr:`${masked}\n${mode==='recognition'?'Choisis le mot correctement écrit.':'Complète la lettre manquante. Écris le mot entier.'}`,...(mode==='recognition'?{choices:[answerFr,wrong]}:{}),answerFr,hintFr:'Reconnais le mot dans la phrase, puis regarde la voyelle après c.',explanationFr:`${answerFr} : ${why}`};
 }),
 takeawayFr:'Pour le son s, écris ç devant a, o ou u et c devant e ou i. Pour le son k, garde c devant a, o ou u.',boundaryFr:'Le reste du mot est fourni. Cet exercice vérifie le choix de c ou ç, pas une dictée complète ni la maîtrise de tous les mots français. Si le mot est inconnu, son orthographe reste à apprendre.',
 materialExposure:{words:['place','plaçons','plaçait','conçu','facile','canard','décor','calcul',...cases.map(c=>c[0])].map(lemma=>({lemma,form:lemma}))},
}));
