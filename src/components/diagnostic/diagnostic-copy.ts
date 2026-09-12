import {EXERCISE_CONTROL_COPY} from "@/lib/content/exercise-control-copy";
import {FEATURE_LABELS} from "@/lib/diagnostic/granular/feature-labels";
import {RESULT_GROUPS} from "@/lib/diagnostic/granular/result-groups";
import {ASSESSMENT_CONFLICT_MESSAGE} from "@/lib/diagnostic/granular/client-state";
/** Fixed diagnostic wording recorded before the client is delivered. */
export const DIAGNOSTIC_COPY = {
  exerciseControls: EXERCISE_CONTROL_COPY,
  "startTitle": "Ton point de départ",
  "loadingDescription": "Quelques questions pour découvrir ce que tu sais déjà et préparer la suite.",
  "loading": "Chargement de ton diagnostic…",
  "checkTitle": "Vérifions ce que tu sais",
  "resultsTitle": "Tes acquis et tes prochaines étapes",
  "teachingDescription": "Une explication, puis quelques essais pour apprendre à ton rythme.",
  "checkDescription": "Réponds sans aide. Cette nouvelle question permettra de préciser ton bilan.",
  "resultsDescription": "Tu peux commencer à apprendre. Nous vérifierons les points encore incertains au fil de tes activités.",
  "assessmentDescription": "Environ 35 minutes, avec des pauses quand tu veux. Les questions s’adaptent à tes réponses.",
  "reviewNotice": "Nous vérifions encore les questions et les activités de ce parcours. Tu peux apprendre dès maintenant ; ton bilan pourra être ajusté.",
  "skippedNotice": "Question passée. Ce point reste à vérifier.",
  "writingSavedNotice": "Ton texte est enregistré. Ce point reste à vérifier.",
  "answerSavedNotice": "Ta réponse est enregistrée et ton bilan a été mis à jour.",
  "practiceSavedNotice": "Ton entraînement est enregistré. Une nouvelle vérification permettra de voir ce que tu sais faire sans aide.",
  "connectionError": "La connexion a été interrompue. Ta réponse est conservée ; réessaie.",
  "loadingError": "Impossible de charger ton diagnostic. Recharge la page pour réessayer.",
  "pause": "Faire une pause",
  "progressSaved": "Ta progression est enregistrée",
  "ready": "Prêt à commencer ?",
  "pauseHelp": "Prends ton temps. Tu peux quitter cette page et revenir plus tard.",
  "resume": "Reprendre",
  "begin": "Commencer",
  "newCheck": "Une nouvelle vérification",
  "revisionHelp": "Ta première version est enregistrée. Relis ton texte et améliore ce qui te semble nécessaire. Tu peux aussi le garder tel quel.",
  "firstDraftHelp": "Écris d’abord ta première version. Tu pourras ensuite la relire et la modifier.",
  "chooseAnswer": "Choisis ta réponse",
  "yourAnswer": "Ta réponse",
  "supportQuestion": "Quel passage justifie ta réponse ?",
  "saving": "Enregistrement…",
  "saveFirstDraft": "Enregistrer ma première version",
  "sendRevision": "Envoyer ma version relue",
  "validate": "Valider",
  "skip": "Passer cette question",
  "dontKnow": "Je ne sais pas",
  "preparing": "Préparation de la prochaine question…",
  "provisionalHelp": "Ce premier bilan est provisoire. « Pas encore vérifié » ne veut pas dire que tu ne sais pas le faire.",
  "coverageHelp": "Les questions disponibles ne couvrent pas encore tous les points de ce bilan. Les points indiqués « Questions à venir » n’ont pas été évalués et ne sont pas considérés comme des difficultés.",
  "firstActivities": "Pour commencer",
  "verifyDescription": "Vérifier ce point avec une nouvelle question.",
  "learnDescription": "Découvrir l’explication, puis s’entraîner.",
  "consolidateDescription": "Consolider cet acquis.",
  "verifyPoint": "Vérifier ce point",
  "startActivity": "Commencer cette activité",
  "deferredHelp": "Tu as déjà donné assez de réponses aujourd’hui sur certains points. Nous les vérifierons un autre jour pour confirmer tes acquis.",
  "activitiesUnavailable": "Ton bilan est enregistré. Tes activités personnalisées ne sont pas encore disponibles.",
  "optionalTitle": "Tu peux aussi commencer une leçon",
  "optionalHelp": "Ces points restent à vérifier. Tu peux découvrir une explication et t’entraîner dès maintenant.",
  "openLesson": "Ouvrir cette leçon",
  "viewPathway": "Voir mon parcours",
  "reviewAnswers": "Revoir mes réponses au diagnostic",
  "detailsTitle": "Ton bilan détaillé",
  "unverifiedPoint": "Point à vérifier",
  "questionsComing": "Questions à venir",
  "status": {
    "mastered": "Bien acquis",
    "missing": "À travailler",
    "fragile": "À consolider",
    "uncertain": "À confirmer",
    "unknown": "Pas encore vérifié"
  },
  "mode": {
    "recognition": "Reconnaître",
    "production": "Écrire la réponse",
    "interpretation": "Comprendre",
    "independent_production": "Utiliser dans un texte personnel"
  },
  child: {
  "beginPractice": "À moi d’essayer",
  "chooseAnswer": "Choisis ta réponse",
  "yourAnswer": "Ta réponse",
  "saving": "Enregistrement…",
  "checkAnswer": "Vérifier ma réponse",
  "hint": "Un indice",
  "correct": "Oui, c’est ça !",
  "correction": "Regarde la correction.",
  "answerPrefix": "Ta réponse :",
  "finishPractice": "Terminer l’entraînement",
  "nextExercise": "Exercice suivant",
  "loadingExercise": "Chargement de l’exercice…",
  "leaveHelp": "Tu peux fermer cette page et reprendre ici plus tard. Quitter l’activité maintenant te ramène au bilan.",
  "leave": "Quitter l’activité",
  "audioHelp": "Écoute le mot jusqu’au bout avant de répondre. Tu peux le réécouter.",
  "audioLabel": "Écouter le mot",
  "teachingAudioError": "Le son ne peut pas être lu. Tu peux réessayer ou quitter l’activité pour revenir à ton bilan.",
  "assessmentAudioError": "Le son ne peut pas être lu. Tu peux passer cette question ; cela ne comptera pas comme une erreur.",
  "writingTitle": "Retour sur ton texte",
  "writingSkillPrefix": "Point travaillé :",
  "writingUnassessed": "Ton texte est enregistré. Il ne permet pas encore de vérifier ce point. Tu peux continuer ton parcours ; nous le vérifierons avec une autre activité.",
  "writingCorrectSingle": "Le passage vérifié est correct pour ce point.",
  "writingScope": "Ce retour porte sur les passages vérifiés pour cette compétence. Tes prochains textes aideront à confirmer tes acquis.",
  "reread": "Relire mon texte",
  "passageCorrect": "Correct pour ce point",
  "passageReview": "À revoir",
  "featureTitle": "Détail des réponses prises en compte",
  "featureUnknown": "Pas encore vérifié",
  "featureScope": "Le statut tient aussi compte de questions différentes et de vérifications à différents moments."
},
  featureLabels:Object.values(FEATURE_LABELS),
  resultGroups:RESULT_GROUPS.map(group=>group.labelFr),
  conflict:ASSESSMENT_CONFLICT_MESSAGE,
} as const;

export const diagnosticProgressText=(answered:number,skipped:number,remainingSeconds:number)=>`${answered} réponse${answered===1?"":"s"} enregistrée${answered===1?"":"s"}${skipped>0?` · ${skipped} question${skipped===1?"":"s"} passée${skipped===1?"":"s"}`:""} · environ ${Math.ceil(remainingSeconds/60)} min restantes`;
export const diagnosticQuestionText=(answered:number,skipped:number)=>`Question ${answered+skipped+1}`;
export const diagnosticAnswerCountText=(count:number)=>`${count} réponse(s)`;
export const teachingProgressText=(index:number,total:number)=>`Entraînement ${index+1} sur ${total} · Tu peux demander de l’aide.`;
export const featureCountText=(correct:number,total:number)=>`${correct} réponse${correct===1?'':'s'} réussie${correct===1?'':'s'} sur ${total}`;
export function writingCountText(checked:number,correct:number){
 const mistakes=checked-correct;
 return mistakes===0?(checked===1?DIAGNOSTIC_COPY.child.writingCorrectSingle:`Les ${checked} passages vérifiés sont corrects pour ce point.`):`${mistakes} passage${mistakes===1?'':'s'} à revoir parmi ${checked} vérifié${checked===1?'':'s'}.`;
}
