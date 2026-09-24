import {SKILL_EVIDENCE_COPY} from "@/lib/diagnostic/granular/skill-evidence-display";
import {EXERCISE_CONTROL_COPY} from "@/lib/content/exercise-control-copy";
import {FEATURE_LABELS} from "@/lib/diagnostic/granular/feature-labels";
import {RESULT_GROUPS} from "@/lib/diagnostic/granular/result-groups";
import {ASSESSMENT_CONFLICT_MESSAGE} from "@/lib/diagnostic/granular/client-state";
import {STUDENT_RESULT_SUMMARY_COPY} from "@/lib/diagnostic/granular/student-results-display";
/** Fixed diagnostic wording recorded before the client is delivered. */
export const DIAGNOSTIC_COPY = {
  skillEvidence:SKILL_EVIDENCE_COPY,
  resultSummary:STUDENT_RESULT_SUMMARY_COPY,
  exerciseControls: EXERCISE_CONTROL_COPY,
  "startTitle": "Ton point de départ",
  "loadingDescription": "Quelques questions pour découvrir ce que tu sais déjà et préparer la suite.",
  "loading": "Chargement des questions…",
  "checkTitle": "Vérifions ce que tu sais",
  "resultsTitle": "Ce que tes réponses montrent et la suite",
  "teachingDescription": "Une explication, puis quelques essais pour apprendre à ton rythme.",
  "checkDescription": "Réponds sans aide. Cette question nous aidera à mieux voir ce que tu sais faire.",
  "resultsDescription": "Tu peux commencer à apprendre. Certaines réponses montrent déjà tes points forts ; d’autres points restent à travailler ou à vérifier.",
  "assessmentDescription": "Environ 35 minutes, avec des pauses quand tu veux. Les questions s’adaptent à tes réponses.",
  "reviewNotice": "Nous vérifions encore les questions et les activités. Tu peux apprendre dès maintenant. Ce bilan pourra changer.",
  "skippedNotice": "Tu as passé cette question. Ce point reste à vérifier.",
  "writingSavedNotice": "Ton texte est enregistré. Ce point reste à vérifier.",
  "answerSavedNotice": "Ta réponse est enregistrée et ton bilan a été mis à jour.",
  "practiceSavedNotice": "Ton entraînement est enregistré. Une nouvelle vérification permettra de voir ce que tu sais faire sans aide.",
  "connectionError": "La connexion a été interrompue. Ta réponse est conservée ; réessaie.",
  "loadingError": "Impossible de charger les questions. Recharge la page pour réessayer.",
  "pause": "Faire une pause",
  "adaptiveProgressHelp": "Le nombre de questions change selon tes réponses.",
  "timeProgressLabel": "Temps passé sur les questions",
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
  "provisionalHelp": "Ce premier bilan peut encore changer. « Pas encore vérifié » ne veut pas dire que tu ne sais pas le faire.",
  "coverageHelp": "Il n’y a pas encore de questions pour tous les points. « Questions à venir » veut dire que nous n’avons pas vérifié ce point, pas que tu as des difficultés.",
  "firstActivities": "Pour commencer",
  "verifyDescription": "Vérifier ce point avec une nouvelle question.",
  "learnDescription": "Découvrir l’explication, puis s’entraîner.",
  "consolidateDescription": "Encore un peu d’entraînement.",
  "verifyPoint": "Vérifier ce point",
  "startActivity": "Commencer cette activité",
  "deferredHelp": "Tu as déjà répondu à assez de questions aujourd’hui sur certains points. Nous te poserons d’autres questions un autre jour pour voir si tu sais toujours les faire.",
  "activitiesUnavailable": "Ton bilan est enregistré. Les activités choisies pour toi ne sont pas encore disponibles.",
  "optionalTitle": "Tu peux aussi commencer une leçon",
  "optionalHelp": "Ces points restent à vérifier. Tu peux découvrir une explication et t’entraîner dès maintenant.",
  "openLesson": "Ouvrir cette leçon",
  "viewPathway": "Voir mon parcours",
  "reviewAnswers": "Revoir mes réponses au diagnostic",
  "retakeTitle": "Faire un nouveau diagnostic",
  "retakeHelp": "Tu peux refaire le diagnostic. Tu pourras toujours revoir tes anciens résultats. Certaines questions peuvent revenir.",
  "retakeButton": "Repasser le diagnostic",
  "retakeError": "Impossible de démarrer un nouveau diagnostic. Réessaie.",
  "historyTitle": "Mes diagnostics précédents",
  "historyCurrent": "Diagnostic actuel",
  "historyReview": "Revoir les réponses",
  "historyVersion": "Version",
  "detailsTitle": "Voir ton bilan détaillé",
  "unverifiedPoint": "Point à vérifier",
  "questionsComing": "Questions à venir",
  "status": {
    "mastered": "Tu sais le faire",
    "missing": "À travailler",
    "fragile": "Encore à travailler",
    "uncertain": "Encore à vérifier",
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
  "loadingExercise": "Préparation de l’exercice…",
  "leaveHelp": "Tu peux fermer cette page et reprendre ici plus tard. Quitter l’activité maintenant te ramène au bilan.",
  "leave": "Quitter l’activité",
  "audioHelp": "Écoute le mot jusqu’au bout avant de répondre. Tu peux le réécouter.",
  "audioLabel": "Écouter le mot",
  "teachingAudioError": "Le son ne peut pas être lu. Tu peux réessayer ou quitter l’activité pour revenir à ton bilan.",
  "assessmentAudioError": "Le son ne peut pas être lu. Tu peux passer cette question ; cela ne comptera pas comme une erreur.",
  "writingTitle": "Retour sur ton texte",
  "writingSkillPrefix": "Ce que nous avons regardé :",
  "writingUnassessed": "Ton texte est enregistré. Nous ne pouvons pas encore dire si tu sais faire ce point. Tu peux continuer ; une autre activité aidera à le vérifier.",
  "writingCorrectSingle": "Le passage vérifié est correct pour ce point.",
  "writingScope": "Ce retour parle seulement des passages que nous avons regardés dans ton texte. D’autres textes nous aideront à voir si tu sais refaire la même chose.",
  "reread": "Relire mon texte",
  "passageCorrect": "Correct pour ce point",
  "passageReview": "À revoir",
  "featureTitle": "Tes réponses en détail",
  "featureUnknown": "Pas encore vérifié",
  "featureScope": "Pour savoir si tu sais le faire, nous regardons aussi tes réponses à d’autres questions, à différents moments."
},
  featureLabels:Object.values(FEATURE_LABELS),
  resultGroups:RESULT_GROUPS.map(group=>group.labelFr),
  conflict:ASSESSMENT_CONFLICT_MESSAGE,
} as const;

export const diagnosticProgressText=(answered:number,skipped:number,remainingSeconds:number)=>`${answered} réponse${answered===1?"":"s"} enregistrée${answered===1?"":"s"}${skipped>0?` · ${skipped} question${skipped===1?"":"s"} passée${skipped===1?"":"s"}`:""} · environ ${Math.ceil(remainingSeconds/60)} min restantes`;
export const diagnosticProgressPercent=(remainingSeconds:number,totalSeconds=35*60)=>Math.max(0,Math.min(100,Math.round((1-remainingSeconds/totalSeconds)*100)));
export const diagnosticQuestionText=(answered:number,skipped:number)=>`Question ${answered+skipped+1}`;
export const diagnosticAnswerCountText=(count:number)=>`${count} réponse(s)`;
export const teachingProgressText=(index:number,total:number)=>`Entraînement ${index+1} sur ${total} · Tu peux demander de l’aide.`;
export const featureCountText=(correct:number,total:number)=>`${correct} réponse${correct===1?'':'s'} réussie${correct===1?'':'s'} sur ${total}`;
export function writingCountText(checked:number,correct:number){
 const mistakes=checked-correct;
 return mistakes===0?(checked===1?DIAGNOSTIC_COPY.child.writingCorrectSingle:`Les ${checked} passages vérifiés sont corrects pour ce point.`):`${mistakes} passage${mistakes===1?'':'s'} à revoir parmi ${checked} vérifié${checked===1?'':'s'}.`;
}
