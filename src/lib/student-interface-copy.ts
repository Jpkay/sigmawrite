/** Shared rendered strings; recording them does not imply a student read them. */
export const DASHBOARD_COPY = {
 brand: 'Plume',
 fr: {skip: 'Aller au contenu', quickNavigation: 'Navigation rapide'},
 en: {skip: 'Skip to content', quickNavigation: 'Quick navigation'},
};
export const STUDENT_INTERFACE_COPY = {
 theme: 'Changer de thème',
 signOut: 'Se déconnecter',
 loading: 'Préparation de ton parcours…',
 loadError: 'Impossible de charger ton parcours pour le moment. Réessaie pour retrouver tes résultats et tes leçons.',
 retry: 'Réessayer',
 access: {
  title: 'Invitation inactive',
  description: 'Ton compte doit être associé à une classe ou à un responsable.',
  help: 'Aucune invitation active ne couvre encore ce compte. Demande à ton enseignant ou à ton responsable de vérifier ton inscription.',
  resume: 'Dès que l’invitation est active, tu peux continuer immédiatement, quel que soit ton âge.',
  privacy: 'Comment tes données sont protégées',
 },
} as const;
