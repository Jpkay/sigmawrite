export type ConjugationLesson = {
  family: string;
  eyebrow: string;
  explanation: string;
  pattern: string;
  examples: string[];
  exceptions: string[];
};

type LessonTemplate = Omit<ConjugationLesson, "eyebrow">;

const LESSONS: Record<string, LessonTemplate> = {
  foundation: {
    family: "Fondations",
    explanation: "Repère d’abord le sujet : il commande la personne et le nombre du verbe. Sépare ensuite ce qui reste stable, le radical, de la terminaison.",
    pattern: "sujet → personne et nombre → radical + terminaison",
    examples: ["nous parlons → 1re personne du pluriel", "ils finissent → radical finiss- + terminaison -ent"],
    exceptions: ["Un sujet peut être éloigné du verbe.", "Les verbes très fréquents ont souvent un radical irrégulier."],
  },
  present: {
    family: "Présent de l’indicatif",
    explanation: "Le présent situe une action maintenant, une habitude ou une vérité générale. Choisis la terminaison d’après le sujet, pas d’après le mot placé juste avant le verbe.",
    pattern: "verbes en -er : -e, -es, -e, -ons, -ez, -ent",
    examples: ["Tu parles avec calme.", "Nous finissons avant midi."],
    exceptions: ["être : suis, es, est, sommes, êtes, sont", "avoir : ai, as, a, avons, avez, ont", "aller, faire, pouvoir, vouloir et venir changent de radical."],
  },
  near_future: {
    family: "Futur proche",
    explanation: "Le futur proche annonce une intention, une prévision ou un événement imminent. Seul aller se conjugue ; le second verbe reste à l’infinitif.",
    pattern: "aller au présent + infinitif",
    examples: ["Je vais partir.", "Nous allons vérifier."],
    exceptions: ["Ne conjugue pas les deux verbes : nous allons partir, pas nous allons partons."],
  },
  recent_past: {
    family: "Passé récent",
    explanation: "Le passé récent présente une action qui vient de se terminer. Seul venir se conjugue ; de et l’infinitif restent en place.",
    pattern: "venir au présent + de + infinitif",
    examples: ["Elle vient de finir.", "Ils viennent d’arriver."],
    exceptions: ["Devant une voyelle, de devient d’ : venir d’arriver."],
  },
  composed_past: {
    family: "Passé composé",
    explanation: "Le passé composé présente généralement un événement accompli. Il combine un auxiliaire au présent et un participe passé.",
    pattern: "avoir ou être au présent + participe passé",
    examples: ["Nous avons compris.", "Elles sont arrivées."],
    exceptions: ["Les verbes pronominaux et plusieurs verbes de déplacement prennent être.", "Avec être, le participe s’accorde avec le sujet.", "Avec avoir, l’accord dépend notamment d’un COD placé avant."],
  },
  imperfect: {
    family: "Imparfait",
    explanation: "L’imparfait installe un décor, une habitude ou une action en cours dans le passé. Pars normalement de la forme nous au présent sans -ons.",
    pattern: "radical de nous + -ais, -ais, -ait, -ions, -iez, -aient",
    examples: ["nous faisons → je faisais", "nous mangeons → il mangeait"],
    exceptions: ["être utilise le radical ét- : j’étais.", "Les verbes en -ger gardent e devant -ait ; ceux en -cer prennent ç devant a."],
  },
  contrast: {
    family: "Passé composé ou imparfait",
    explanation: "Choisis le temps selon le rôle de l’action, pas selon sa durée : l’imparfait installe l’arrière-plan ; le passé composé fait avancer les événements.",
    pattern: "cadre ou habitude → imparfait · événement borné → passé composé",
    examples: ["Il pleuvait quand le bus est arrivé.", "Chaque été, nous allions au lac."],
    exceptions: ["Une action longue peut être au passé composé si elle est vue comme terminée.", "Un événement bref peut être à l’imparfait s’il sert d’arrière-plan."],
  },
  simple_past: {
    family: "Passé simple",
    explanation: "Le passé simple apparaît surtout dans les récits écrits. Ici, l’objectif principal est de le reconnaître et de comprendre qu’il fait avancer l’action.",
    pattern: "reconnaître la forme et son rôle narratif",
    examples: ["Il entra, regarda et comprit.", "Ils furent surpris."],
    exceptions: ["Les formes de être, avoir, faire, venir et tenir sont très irrégulières.", "La production systématique n’est pas exigée au niveau introductif."],
  },
  future: {
    family: "Futur simple",
    explanation: "Le futur simple projette une action dans l’avenir. Pour les verbes réguliers, ajoute les terminaisons du futur à l’infinitif.",
    pattern: "radical du futur + -ai, -as, -a, -ons, -ez, -ont",
    examples: ["Je parlerai demain.", "Nous finirons bientôt."],
    exceptions: ["être → ser-, avoir → aur-, aller → ir-, faire → fer-", "venir → viendr-, voir → verr-, pouvoir → pourr-, vouloir → voudr-"],
  },
  pluperfect: {
    family: "Plus-que-parfait",
    explanation: "Le plus-que-parfait situe une action avant une autre action déjà passée. Il emploie le même auxiliaire que le passé composé, mais à l’imparfait.",
    pattern: "avoir ou être à l’imparfait + participe passé",
    examples: ["Elle avait terminé avant midi.", "Ils étaient partis quand je suis arrivé."],
    exceptions: ["Avec être, le participe s’accorde avec le sujet.", "Le choix de l’auxiliaire reste celui du passé composé."],
  },
  conditional: {
    family: "Conditionnel présent",
    explanation: "Le conditionnel exprime notamment une hypothèse, un souhait ou une demande atténuée. Il combine le radical du futur et les terminaisons de l’imparfait.",
    pattern: "radical du futur + -ais, -ais, -ait, -ions, -iez, -aient",
    examples: ["Je viendrais si je pouvais.", "Pourriez-vous répondre ?"],
    exceptions: ["Il partage les radicaux irréguliers du futur : ser-, aur-, ir-, fer-, viendr-.", "Après si, on n’emploie normalement pas le conditionnel dans la proposition introduite par si."],
  },
  subjunctive: {
    family: "Subjonctif présent",
    explanation: "Le subjonctif apparaît après certaines constructions exprimant nécessité, volonté, doute ou émotion. Apprends-le avec son déclencheur, pas comme une règle après tout que.",
    pattern: "déclencheur fréquent + que + forme au subjonctif",
    examples: ["Il faut que tu viennes.", "Je veux qu’elle fasse attention."],
    exceptions: ["être → sois, avoir → aie, aller → aille, faire → fasse", "Que seul ne déclenche pas le subjonctif ; le sens de la construction compte."],
  },
  imperative: {
    family: "Impératif présent",
    explanation: "L’impératif sert à donner un ordre, un conseil ou une instruction. Le sujet n’est pas écrit et seules les personnes tu, nous et vous existent.",
    pattern: "forme de tu, nous ou vous sans sujet exprimé",
    examples: ["Écoute attentivement.", "Finissons ensemble."],
    exceptions: ["Les verbes en -er et aller perdent généralement le -s à tu : parle, va.", "être → sois, soyons, soyez ; avoir → aie, ayons, ayez."],
  },
  nonfinite: {
    family: "Infinitif et participe passé",
    explanation: "L’infinitif nomme l’action ; le participe passé entre dans un temps composé ou fonctionne parfois comme un adjectif. Observe le mot qui introduit la forme.",
    pattern: "après une préposition ou un verbe → souvent infinitif · avec un auxiliaire → participe",
    examples: ["Il va manger.", "Il a mangé."],
    exceptions: ["À l’oral, -er et -é se prononcent souvent pareil : remplace par prendre/pris pour vérifier."],
  },
  sequencing: {
    family: "Cohérence des temps",
    explanation: "Dans un texte, les temps organisent les événements autour d’un repère. Identifie d’abord ce repère, puis place chaque action avant, pendant ou après.",
    pattern: "repère → antériorité · simultanéité · postériorité",
    examples: ["Il avait préparé le repas avant leur arrivée.", "Elle lisait quand le téléphone a sonné."],
    exceptions: ["Un changement de temps peut être volontaire s’il correspond à un changement de repère ou de point de vue."],
  },
};

function familyFor(nodeKey: string): keyof typeof LESSONS {
  if (nodeKey.includes("futur_proche")) return "near_future";
  if (nodeKey.includes("passe_recent")) return "recent_past";
  if (nodeKey.includes("passe_compose") || nodeKey.includes("auxiliaire") || nodeKey.includes("participe_etre") || nodeKey.includes("participe_avoir")) return "composed_past";
  if (nodeKey.includes("pc_imparfait") || nodeKey.includes("contraste")) return "contrast";
  if (nodeKey.includes("imparfait")) return "imperfect";
  if (nodeKey.includes("passe_simple")) return "simple_past";
  if (nodeKey.includes("futur_simple")) return "future";
  if (nodeKey.includes("plus_que_parfait") || nodeKey.includes("anteriorite_passee")) return "pluperfect";
  if (nodeKey.includes("conditionnel")) return "conditional";
  if (nodeKey.includes("subjonctif")) return "subjunctive";
  if (nodeKey.includes("imperatif")) return "imperative";
  if (nodeKey.includes("infinitif") || nodeKey.includes("forme_non_finie")) return "nonfinite";
  if (nodeKey.includes("sequence_temporelle")) return "sequencing";
  if (nodeKey.includes("present")) return "present";
  return "foundation";
}

export function conjugationLesson(nodeKey: string, nodeLabel: string): ConjugationLesson {
  const lesson = LESSONS[familyFor(nodeKey)];
  return { ...lesson, eyebrow: `Leçon express · ${nodeLabel}` };
}

export const CONJUGATION_LESSON_FAMILIES = Object.keys(LESSONS);
