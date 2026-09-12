/** Original prompts for the approved family-recognition target. Classification
 * uses named models so differences in school group numbering do not change it.
 * Supplied forms assess recognition, never unaided conjugation production. */
export const VERB_FAMILY_LABELS={er:'Comme chanter : chanter, nous chantons',ir:'Comme finir : finir, nous finissons',other:'Une autre famille de verbes'} as const;
export const VERB_FAMILY_RECOGNITION_DRAFTS=[
 ...[
  ['parler','parlons','parle'],['jouer','jouons','joue'],['danser','dansons','danse'],['marcher','marchons','marche'],
  ['dessiner','dessinons','dessine'],['écouter','écoutons','écoute'],['regarder','regardons','regarde'],['trouver','trouvons','trouve'],
 ].map(([infinitive,nous,je])=>({infinitive,nous,je,family:'er' as const})),
 ...[
  ['choisir','choisissons','choisis'],['grandir','grandissons','grandis'],['réussir','réussissons','réussis'],['remplir','remplissons','remplis'],
  ['rougir','rougissons','rougis'],['réfléchir','réfléchissons','réfléchis'],['nourrir','nourrissons','nourris'],['applaudir','applaudissons','applaudis'],
 ].map(([infinitive,nous,je])=>({infinitive,nous,je,family:'ir' as const})),
 ...[
  ['aller','allons','vais'],['partir','partons','pars'],['sortir','sortons','sors'],['dormir','dormons','dors'],
  ['courir','courons','cours'],['prendre','prenons','prends'],['voir','voyons','vois'],['faire','faisons','fais'],
 ].map(([infinitive,nous,je])=>({infinitive,nous,je,family:'other' as const})),
] as const;
