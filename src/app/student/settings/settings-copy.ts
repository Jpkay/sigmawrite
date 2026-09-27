/** Static copy delivered to the settings client. Never add form values here. */
export const settingsCopy = {
  "pageTitle": "Paramètres",
  "pageDescription": "Confort de lecture et sécurité du compte.",
  "readingTitle": "Confort de lecture",
  "textSize": "Taille du texte",
  "normal": "Normale",
  "large": "Grande",
  "extra": "Très grande",
  "reducedMotion": "Réduire les animations",
  "deviceNotice": "Ces préférences restent seulement sur cet appareil.",
  "security": "Sécurité",
  "passwordHelp": "Choisis au moins 12 caractères. Ton parent peut aussi le renouveler depuis son compte lié.",
  "newPassword": "Nouveau mot de passe",
  "confirm": "Confirmer",
  "saving": "Enregistrement…",
  "renewPassword": "Renouveler mon mot de passe",
  "passwordMismatch": "Les mots de passe ne correspondent pas.",
  "passwordChanged": "Ton mot de passe a été renouvelé.",
  "failure": "Modification impossible.",
  dailyTitle: "Objectif quotidien",
  dailyDescription: "Un XP vaut à peu près une minute de travail concentré. Une lecture, une leçon ou une dictée suffit pour l’atteindre.",
  dailyLegend: "Objectif quotidien en XP",
  dailyLabels: {10: "Tranquille · ~10 min", 15: "Régulier · ~15 min", 20: "Ambitieux · ~20 min"},
  dailySaved: {10: "Objectif quotidien : 10 XP.", 15: "Objectif quotidien : 15 XP.", 20: "Objectif quotidien : 20 XP."},
  dailyValues: {10: "10 XP", 15: "15 XP", 20: "20 XP"}
} as const;
export type SettingsCopy = typeof settingsCopy;
