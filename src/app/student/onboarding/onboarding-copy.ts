import {INTERESTS} from "@/lib/content/interests";
export const ONBOARDING_EXPOSURES = [
  { key: "home", label: "À la maison" },
  { key: "school", label: "À l’école, dans plusieurs matières" },
  { key: "class_only", label: "Pendant les cours de français" },
  { key: "immersion", label: "Avec des personnes qui parlent français autour de moi" },
  { key: "self_study", label: "Par moi-même : livres, vidéos, applis…" },
];
export const onboardingCopy = {
  "title": "Bienvenue 👋",
  "description": "Quelques questions pour te connaître. Le diagnostic nous aidera ensuite à trouver ton point de départ et à t’aider à progresser en classe.",
  "saveError": "Ton profil n'a pas pu être enregistré. Réessaie.",
  "completed": "Ton diagnostic est terminé. Ouverture de tes leçons…",
  "grade": "Ta classe",
  "gradeHelp": "Niveau transmis par ta classe. Ton établissement peut le corriger si nécessaire.",
  "background": "Ton parcours en français",
  "backgroundHelp": "Choisis la situation qui te ressemble le plus.",
  "exposureQuestion": "Où utilises-tu le français ?",
  "exposureHelp": "Tu peux cocher plusieurs réponses.",
  "diagnosticScope": "Le diagnostic porte sur la lecture et l’écriture. Il n’évalue pas encore l’oral.",
  "continue": "Continuer",
  "interestsQuestion": "Qu'est-ce qui t'intéresse ?",
  "interestsHelp": "Choisis au moins 3 sujets. Tes textes partiront de là.",
  "back": "Retour",
  "start": "Commencer le diagnostic"
} as const;
export const ONBOARDING_GRADES = [
  {
    "value": 5,
    "label": "CM2 · 5e année (BE) · 5e année (QC)"
  },
  {
    "value": 6,
    "label": "6e · 6e année (BE) · 6e année (QC)"
  },
  {
    "value": 7,
    "label": "5e · 1re secondaire (BE) · 1re secondaire (QC)"
  },
  {
    "value": 8,
    "label": "4e · 2e secondaire (BE) · 2e secondaire (QC)"
  },
  {
    "value": 9,
    "label": "3e · 3e secondaire (BE) · 3e secondaire (QC)"
  },
  {
    "value": 10,
    "label": "2de · 4e secondaire (BE) · 4e secondaire (QC)"
  },
  {
    "value": 11,
    "label": "1re · 5e secondaire (BE) · 5e secondaire (QC)"
  },
  {
    "value": 12,
    "label": "Terminale · 6e secondaire (BE) · Cégep 1 (QC)"
  }
];
export const ONBOARDING_BACKGROUNDS = [
  {
    "value": "french_first_language",
    "label": "J’ai grandi en parlant surtout français"
  },
  {
    "value": "heritage",
    "label": "Le français vient de ma famille"
  },
  {
    "value": "immersion",
    "label": "J’apprends des matières en français pour apprendre la langue"
  },
  {
    "value": "allophone",
    "label": "À la maison, je parle une autre langue"
  },
  {
    "value": "french_second_language",
    "label": "J’apprends le français comme une nouvelle langue"
  },
  {
    "value": "bilingual",
    "label": "Je parle français et une autre langue au quotidien"
  }
];
export const onboardingPayload = {
 copy:onboardingCopy,
 grades:ONBOARDING_GRADES,
 backgrounds:ONBOARDING_BACKGROUNDS,
 exposures:ONBOARDING_EXPOSURES,
 interests:INTERESTS.map(({key,labelFr,emoji})=>({key,labelFr,emoji})),
 remaining:["", "Encore 1 sujet.", "Encore 2 sujets.", "Encore 3 sujets."],
};
export type OnboardingPayload = typeof onboardingPayload;
/** Only delivered display copy, not routing metadata or a student's choices. */
export const onboardingDisplayText = {
 copy:onboardingPayload.copy,
 grades:onboardingPayload.grades.map(option=>option.label),
 backgrounds:onboardingPayload.backgrounds.map(option=>option.label),
 exposures:onboardingPayload.exposures.map(option=>option.label),
 interests:onboardingPayload.interests.map(({labelFr,emoji})=>({labelFr,emoji})),
 remaining:onboardingPayload.remaining,
};
