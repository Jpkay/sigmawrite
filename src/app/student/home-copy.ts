import {homeDynamicDisplay} from '@/lib/diagnostic/granular/home-display-text';
export const HOME_COPY={
 initialDynamic:homeDynamicDisplay({plan:null,fallbackPlan:null,motivation:null,texts:null}),
 greeting:'Bonjour 👋',loading:'Chargement…',onboarding:'Crée ton profil de lecture en quelques minutes.',
 knowYou:'Commençons par te connaître.',start:'Démarrer',oneStep:'Encore une étape.',
 diagnosticHelp:'Fais le diagnostic pour construire ton profil en lecture, grammaire, orthographe et conjugaison.',diagnostic:'Diagnostic',
 skillProfile:'Bilan par compétence',readingBand:'Bande de lecture',available:'Disponible',completed:'Textes complétés',average:'Réussite moyenne',target:'Zone cible',targetValue:'80–85%',
 eyebrow:'Ton espace de lecture',description:'Ta prochaine étape est prête. Avance à ton rythme, une lecture après l’autre.',freeze:'Gel de série disponible',
 lessons:'Mes leçons',results:'Voir mes résultats',updateTitle:'Mets ton profil à jour',updateHelp:'Quelques questions ciblées suffisent. Tes progrès précédents sont conservés.',update:'Mettre à jour',
 mission:'Mission du jour',resumeTitle:'Continue là où tu t’es arrêté.',goalDone:'Objectif du jour atteint. Bien joué !',step:'Une étape suffit pour avancer.',missionHelp:'Lis un texte ou entraîne une compétence. Ton parcours s’ajuste après chaque réponse.',resume:'Reprendre la lecture',beginToday:'Commencer aujourd’hui',
 dailyGoal:'Objectif quotidien',modify:'modifier',finished:'Textes terminés',plan:'Plan du jour',planHelp:'Révisions et nouvelles étapes, dans le bon ordre',
 memory:'Mémoire',dictation:'Dictée',write:'Écrire',revise:'Réviser',practice:'S’entraîner',
 reading:'Choisis ta prochaine lecture',recommended:'Recommandée pour toi',alternative:'Autre piste',choose:'Choisir ce texte',profile:'Ton profil en bref',
} as const;
