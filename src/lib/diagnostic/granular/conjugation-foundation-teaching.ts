import type {TargetTeachingContent} from "./teaching-content";
const lessons:TargetTeachingContent[]=[
 {
  id:"french-v3-teaching:recognition:present-foundation",nodeKey:"reconnaitre_present_indicatif",mode:"recognition",status:"draft_requires_review",
  titleFr:"Reconnaître un verbe au présent",learnerQuestionFr:"Qu’est-ce qui change entre « elle bricole » et « elle bricolait » ?",
  steps:[
   {exampleFr:"Elle bricole une étagère. Elle bricolait une étagère.",explanationFr:"Le même verbe apparaît sous deux formes. Bricole est au présent de l’indicatif. Bricolait est à l’imparfait, un temps du passé. Pour nommer le temps, regarde la forme du verbe."},
   {exampleFr:"Je tricote. Tu tricotes. Nous tricotons.",explanationFr:"Ces trois formes sont au présent. Leur fin change avec la personne : je, tu ou nous. Une seule terminaison ne permet donc pas de reconnaître tous les présents."},
   {exampleFr:"Elle tousse. Elle toussera. Elle a toussé.",explanationFr:"Tousse est au présent. Toussera est au futur simple. A toussé forme un passé composé : il faut regarder les deux mots ensemble, même si a est lui-même une forme du présent d’avoir."},
   {exampleFr:"Chaque samedi, il jardine. Demain, il jardine avec sa tante.",explanationFr:"Jardine reste au présent dans les deux phrases. Le présent peut décrire une habitude ou une action prévue. Le mot demain indique le moment ; il ne change pas la forme du verbe."},
  ],
  takeawayFr:"Repère le verbe et observe sa forme entière. Le présent change selon la personne. Le moment raconté et le nom du temps ne sont pas toujours la même chose.",
  boundaryFr:"Ces exemples aident à reconnaître le présent. Certains verbes changent davantage de forme et demandent un apprentissage particulier. Cette leçon ne prouve pas que tu sais les conjuguer tous, ni que tu sais choisir le bon temps dans un texte.",
  practice:[
   {id:"present-foundation-1",promptFr:"Quelle phrase contient le présent de l’indicatif ?",choices:["Tu bavardes avec ta voisine.","Tu bavardais avec ta voisine.","Tu bavarderas avec ta voisine.","Tu as bavardé avec ta voisine."],answerFr:"Tu bavardes avec ta voisine.",hintFr:"Compare bavardes, bavardais, bavarderas et as bavardé.",explanationFr:"Bavardes est au présent avec tu. Bavardais est à l’imparfait, bavarderas au futur simple et as bavardé au passé composé."},
   {id:"present-foundation-2",promptFr:"Quelle phrase contient un verbe au présent ?",choices:["Nous éternuons à cause de la poussière.","Nous éternuions à cause de la poussière.","Nous éternuerons à cause de la poussière.","Nous avons éternué à cause de la poussière."],answerFr:"Nous éternuons à cause de la poussière.",hintFr:"Avec nous, ce verbe régulier se termine par -ons au présent.",explanationFr:"Éternuons est au présent. Éternuions, avec un i supplémentaire, est à l’imparfait."},
   {id:"present-foundation-3",promptFr:"Demain, elle tricote chez sa grand-mère.\n\nÀ quel temps le verbe tricote est-il conjugué ?",choices:["Au présent de l’indicatif.","Au futur simple.","À l’imparfait.","Au passé composé."],answerFr:"Au présent de l’indicatif.",hintFr:"Demain situe l’action. Observe la forme tricote pour nommer le temps.",explanationFr:"Tricote est une forme du présent, même quand la phrase annonce une activité de demain."},
   {id:"present-foundation-4",promptFr:"Le chat a ronflé. Le chat ronfle.\n\nQuel groupe est au passé composé, et non au présent ?",choices:["a ronflé","ronfle"],answerFr:"a ronflé",hintFr:"Regarde le groupe de deux mots, pas seulement a.",explanationFr:"A ronflé réunit avoir et le participe passé ronflé. Le groupe entier est au passé composé. Ronfle est au présent."},
   {id:"present-foundation-5",promptFr:"Quelle phrase est au présent ?",choices:["Vous jardinez près de la maison.","Vous jardiniez près de la maison.","Vous jardinerez près de la maison.","Vous avez jardiné près de la maison."],answerFr:"Vous jardinez près de la maison.",hintFr:"Compare jardinez à jardiniez : une lettre distingue ici deux temps.",explanationFr:"Jardinez est au présent avec vous. Jardiniez est à l’imparfait ; jardinerez est au futur simple."},
   {id:"present-foundation-6",promptFr:"Chaque soir, ils bricolent dans le garage.\n\nQue peux-tu dire de bricolent ?",choices:["C’est un présent qui exprime une habitude.","C’est un futur parce que l’action se répète.","C’est un passé composé.","C’est un infinitif."],answerFr:"C’est un présent qui exprime une habitude.",hintFr:"Une habitude peut s’exprimer au présent.",explanationFr:"Bricolent est conjugué au présent avec ils. Chaque soir indique que l’activité se répète."},
  ],
 },
 {
  id:"french-v3-teaching:recognition:stem-ending-foundation",nodeKey:"reconnaitre_radical_terminaison",mode:"recognition",status:"draft_requires_review",
  titleFr:"Repérer la base et la fin d’un verbe",learnerQuestionFr:"Dans « nous tricotons » et « vous tricotez », quelle partie reconnais-tu ?",
  steps:[
   {exampleFr:"nous tricotons → tricot / ons ; vous tricotez → tricot / ez",explanationFr:"Le morceau tricot porte le sens de l’action et reste le même dans ces deux formes. Il s’appelle le radical. La fin, ons ou ez, s’appelle la terminaison."},
   {exampleFr:"tricoter → tricot / er ; nous tricotions → tricot / ions",explanationFr:"Pour ce verbe régulier en -er, enlever -er à l’infinitif tricoter donne la base tricot. On retrouve cette base dans tricotions. La terminaison entière est ions, pas seulement ons."},
   {exampleFr:"tu bricolais → bricol / ais ; vous bricoliez → bricol / iez",explanationFr:"Une terminaison peut avoir plusieurs lettres. Elle apporte des indications sur le temps et la personne. Ne coupe pas automatiquement avant la dernière lettre."},
   {exampleFr:"nous bavardons → bavard / ons",explanationFr:"Vérifie les deux morceaux : bavard + ons reconstitue exactement bavardons. La base correspond ici à celle de bavarder, le verbe à l’infinitif."},
  ],
  takeawayFr:"Dans les verbes réguliers en -er de cette leçon, retrouve la base grâce à l’infinitif. Sépare ensuite toute la terminaison, même lorsqu’elle compte plusieurs lettres.",
  boundaryFr:"Cette méthode est illustrée avec des verbes réguliers en -er. Le radical de certains autres verbes peut changer selon les formes. Ne suppose pas que retirer deux lettres fonctionne pour tous les verbes ou tous les temps.",
  practice:[
   {id:"stem-foundation-1",promptFr:"Sépare le radical et la terminaison dans bavardez, du verbe bavarder.",choices:["bavard / ez","bavar / dez","bavarde / z","ba / vardez"],answerFr:"bavard / ez",hintFr:"Retire -er à bavarder pour retrouver la base.",explanationFr:"La base est bavard. La terminaison ez donne bavardez."},
   {id:"stem-foundation-2",promptFr:"Sépare le radical et la terminaison dans bricolons, du verbe bricoler.",choices:["bricol / ons","brico / lons","bricolo / ns","bricolon / s"],answerFr:"bricol / ons",hintFr:"La terminaison avec nous est ici -ons en entier.",explanationFr:"Bricol est le radical et ons la terminaison."},
   {id:"stem-foundation-3",promptFr:"Sépare le radical et la terminaison dans jardinions, du verbe jardiner.",choices:["jardin / ions","jardini / ons","jardinio / ns","jardinion / s"],answerFr:"jardin / ions",hintFr:"L’infinitif jardiner donne la base jardin.",explanationFr:"Jardin reste la base. La terminaison de cette forme à l’imparfait est ions, avec le i."},
   {id:"stem-foundation-4",promptFr:"Dans tu toussais, du verbe tousser, quelle est la terminaison entière ?",choices:["ais","s","is","touss"],answerFr:"ais",hintFr:"Compare tousser et toussais : quel morceau suit touss ?",explanationFr:"Touss est le radical. Ais est la terminaison entière."},
   {id:"stem-foundation-5",promptFr:"Dans vous ronfliez, du verbe ronfler, quel est le radical ?",choices:["ronfl","ronfli","ron","iez"],answerFr:"ronfl",hintFr:"La base de ronfler se retrouve avant la terminaison iez.",explanationFr:"Ronfl + iez reconstitue ronfliez. Le i appartient ici à la terminaison."},
   {id:"stem-foundation-6",promptFr:"Dans nous éternuons, du verbe éternuer, quelle séparation convient ?",choices:["éternu / ons","étern / uons","éternuo / ns","éternuon / s"],answerFr:"éternu / ons",hintFr:"Retire -er à éternuer. Le u reste dans la base.",explanationFr:"Le radical est éternu. Avec la terminaison ons, il forme éternuons."},
  ],
 },
];
export const CONJUGATION_FOUNDATION_TEACHING:readonly TargetTeachingContent[]=lessons.map(lesson=>({...lesson,materialExposure:{sentences:[...lesson.steps.map(step=>step.exampleFr),...lesson.practice.flatMap(exercise=>[exercise.promptFr,...(exercise.choices??[])])]}}));
