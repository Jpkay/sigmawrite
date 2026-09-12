/** First authored writing tasks. No model paragraph or answer key is exposed.
 * These are drafts, not released questions or evidence of student mastery. */
export const CONNECTED_WRITING_DRAFTS=[
 {key:'present-club',nodeKey:'employer_present_indicatif_en_contexte',contextKey:'writing:club-routine',promptFr:'Présente un club réel ou inventé : ce que ses membres font habituellement et comment les rencontres se passent.'},
 {key:'present-scene',nodeKey:'employer_present_indicatif_en_contexte',contextKey:'writing:live-scene',promptFr:'Imagine une scène dans une gare, un parc ou une convention de mangas. Raconte ce qui se passe en ce moment, comme si tu y étais.'},
 {key:'present-character',nodeKey:'employer_present_indicatif_en_contexte',contextKey:'writing:character-habits',promptFr:'Présente un personnage : son quotidien, ses goûts et ses habitudes. Relie tes idées pour former un petit paragraphe.'},
 {key:'imperfect-holidays',nodeKey:'employer_imparfait_en_contexte',contextKey:'writing:past-holiday-habits',promptFr:'Raconte les habitudes d’un personnage pendant ses vacances autrefois : ce qu’il faisait régulièrement et avec qui il passait son temps.'},
 {key:'imperfect-place',nodeKey:'employer_imparfait_en_contexte',contextKey:'writing:past-place-background',promptFr:'Décris un lieu tel qu’il était autrefois : son ambiance, ce qu’on y voyait et ce que les personnes y faisaient habituellement.'},
 {key:'imperfect-before-event',nodeKey:'employer_imparfait_en_contexte',contextKey:'writing:past-event-background',promptFr:'Imagine les minutes avant le début d’un spectacle passé. Décris l’ambiance et les actions qui étaient en cours pendant l’attente.'},
] as const;
export const CONNECTED_WRITING_INSTRUCTIONS='Écris un court paragraphe avec des phrases reliées entre elles. Utilise tes propres idées, sans modèle. Tu peux inventer la situation.';
