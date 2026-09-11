import { conjugate, PERSONS, type Person } from "@/lib/linguistic/conjugation";
import type { TargetTeachingContent } from "./teaching-content";

type Case = { verb: string; person: Person; sentence: string; hint: string; why: string };
type LessonDraft = {
  key: string; model: string; title: string; question: string;
  steps: TargetTeachingContent["steps"]; takeaway: string; boundary: string; cases: Case[]; extraVerbs?: string[];
};
const c = (verb: string, person: Person, sentence: string, hint: string, why: string): Case => ({ verb, person, sentence, hint, why });
const subjects: Record<Person, string> = { "1s": "je", "2s": "tu", "3s": "il / elle / on", "1p": "nous", "2p": "vous", "3p": "ils / elles" };
const form = (verb: string, person: Person) => conjugate(verb, "present", person);

/** Authoring drafts only. Correct forms come from the deterministic conjugator.
 * These guided responses are exposure and cannot establish independent mastery. */
export const CONJUGATION_TEACHING_CASES: readonly LessonDraft[] = [
  {
    key: "pattern:regular_er", model: "parler", extraVerbs: ["aller", "manger", "lancer"], title: "Changer la fin d’un verbe comme parler",
    question: "Pourquoi écrit-on « je parle », mais « nous parlons » ?",
    steps: [
      { exampleFr: `Je ${form("parler", "1s")} du film. Nous ${form("parler", "1p")} du film.`, explanationFr: "La personne qui parle change : je, puis nous. Le début parl- reste, mais la fin change. Ce début s’appelle le radical ; la fin s’appelle la terminaison." },
      { exampleFr: "parler → parl- + une terminaison", explanationFr: "Pour ce modèle régulier, enlève -er à la forme du dictionnaire, puis ajoute la fin correspondant au sujet. Le sujet indique ici qui fait l’action." },
    ],
    takeaway: "Pour les verbes réguliers de ce modèle, garde le radical et choisis la terminaison : -e, -es, -e, -ons, -ez, -ent.",
    boundary: "Finir par -er ne suffit pas : aller change autrement. Certains verbes comme manger ou lancer demandent aussi un ajustement de lettres avec nous. Ils ont leurs propres leçons.",
    cases: [
      c("dessiner", "1s", "Je ___ une couverture de manga.", "Avec je, ajoute -e à dessin-.", "Le sujet je demande la terminaison -e."),
      c("coller", "2s", "Tu ___ une photo dans ton carnet.", "Avec tu, la fin comporte un s.", "On garde coll- et on ajoute -es."),
      c("porter", "3s", "Elle ___ un sac bleu.", "Avec elle, la terminaison est -e.", "Le sujet elle demande -e, sans s."),
      c("écouter", "1p", "Nous ___ une chanson.", "Retire -er, puis ajoute -ons.", "Écout- suivi de -ons donne la forme avec nous."),
      c("visiter", "2p", "Vous ___ un musée.", "La terminaison avec vous est -ez.", "Visit- suivi de -ez donne la forme avec vous."),
      c("filmer", "3p", "Ils ___ leur entraînement.", "Avec ils, écris -ent même si tu ne l’entends pas.", "Le sujet ils demande la terminaison écrite -ent."),
    ],
  },
  {
    key: "pattern:regular_ir", model: "finir", extraVerbs: ["choisir", "partir"], title: "Conjuguer les verbes qui suivent finir",
    question: "D’où vient le morceau « iss » dans « nous finissons » ?",
    steps: [
      { exampleFr: `Je ${form("finir", "1s")} mon dessin. Nous ${form("finir", "1p")} nos dessins.`, explanationFr: "Avec je, le verbe se termine par -is. Avec nous, on entend et on écrit -issons. Ce changement appartient au modèle de finir." },
      { exampleFr: "finir → fin- ; choisir → chois-", explanationFr: "Enlève -ir pour repérer le début conservé, le radical. Ajoute -is, -is, -it au singulier, puis -issons, -issez, -issent avec nous, vous, ils ou elles." },
    ],
    takeaway: "Les verbes du modèle finir prennent -iss- avec nous, vous, ils et elles au présent.",
    boundary: "Tous les verbes en -ir ne suivent pas ce modèle : partir donne nous partons, et non nous partissons. Cette leçon concerne seulement les verbes du modèle finir.",
    cases: [
      c("nourrir", "1s", "Je ___ le chat.", "Garde nourr- et ajoute -is.", "Avec je, ce modèle prend -is."),
      c("remplir", "2s", "Tu ___ ta gourde.", "Avec tu, la forme se termine par -is.", "Rempl- suivi de -is donne la forme avec tu."),
      c("ralentir", "3s", "Le bus ___ avant le virage.", "Le bus se remplace par il. Choisis -it.", "Un sujet équivalent à il demande -it."),
      c("réfléchir", "1p", "Nous ___ à une solution.", "Avec nous, ajoute -issons.", "Le morceau -iss- apparaît dans réfléchissons."),
      c("obéir", "2p", "Vous ___ à cette consigne.", "Garde obé- puis ajoute -issez.", "Avec vous, on écrit -issez."),
      c("applaudir", "3p", "Elles ___ les musiciennes.", "Avec elles, ajoute -issent.", "La forme avec elles contient -iss- et se termine par -ent."),
    ],
  },
  {
    key: "pattern:spelling_ger", model: "manger", title: "Garder le e dans nous mangeons",
    question: "Pourquoi y a-t-il un e avant -ons dans « mangeons » ?",
    steps: [
      { exampleFr: `Je ${form("manger", "1s")} une pomme. Nous ${form("manger", "1p")} une pomme.`, explanationFr: "Le g garde le même son dans les deux formes. Devant le o de -ons, on conserve un e après le g : -geons." },
      { exampleFr: `Nous ${form("nager", "1p")}. Vous ${form("nager", "2p")}.`, explanationFr: "Avec nous, écris nageons. Avec vous, le e de -ez suffit déjà : on écrit nagez, sans ajouter un deuxième e." },
    ],
    takeaway: "Au présent, les verbes de ce modèle en -ger prennent -geons avec nous. Les autres personnes gardent les terminaisons habituelles du modèle parler.",
    boundary: "Le e supplémentaire répond à la lettre qui suit le g. N’en ajoute pas à toutes les formes. Cette leçon porte sur le présent ; les autres temps seront vérifiés séparément.",
    cases: [
      c("nager", "1s", "Je ___ près du bord.", "Avec je, la terminaison -e suit déjà le g.", "On écrit nage, avec un seul e final."),
      c("manger", "2s", "Tu ___ une tartine.", "Avec tu, ajoute la terminaison -es.", "Manges se termine par -es."),
      c("voyager", "3s", "Elle ___ en train.", "Avec elle, la terminaison est -e.", "On garde un seul e après le g."),
      c("bouger", "1p", "Nous ___ les tables.", "Conserve un e entre le g et le o.", "Bougeons garde le son du g grâce au e."),
      c("mélanger", "1p", "Nous ___ les couleurs.", "La fin avec nous est -geons.", "On conserve e avant -ons : mélangeons."),
      c("partager", "1p", "Nous ___ le matériel.", "Garde le e avant le o de -ons.", "Partageons conserve le son du g."),
      c("ranger", "2p", "Vous ___ vos affaires.", "La terminaison -ez contient déjà un e.", "On écrit rangez, sans e supplémentaire."),
      c("charger", "3p", "Ils ___ les sacs dans le coffre.", "Avec ils, choisis -ent.", "Chargent se termine par -ent, sans changer le son du g."),
    ],
  },
  {
    key: "pattern:spelling_cer", model: "lancer", title: "Écrire nous lançons avec ç",
    question: "Pourquoi le c devient-il ç dans « nous lançons » ?",
    steps: [
      { exampleFr: `Je ${form("lancer", "1s")} le ballon. Nous ${form("lancer", "1p")} le ballon.`, explanationFr: "Le c garde le son s. Devant le o de -ons, on lui ajoute une cédille, le petit signe sous la lettre : ç." },
      { exampleFr: `Nous ${form("avancer", "1p")}. Vous ${form("avancer", "2p")}.`, explanationFr: "Devant o, il faut ç dans avançons. Devant le e de -ez, c donne déjà le son s : avancez ne prend pas de cédille." },
    ],
    takeaway: "Au présent, les verbes de ce modèle en -cer prennent -çons avec nous. Devant e, le c reste sans cédille.",
    boundary: "N’ajoute pas de cédille à chaque c du verbe. Regarde la lettre suivante. Cette leçon concerne le présent, pas toutes les formes aux autres temps.",
    cases: [
      c("avancer", "1s", "Je ___ mon pion.", "Devant e, c suffit pour garder le son s.", "Avance ne prend pas de cédille."),
      c("lancer", "2s", "Tu ___ le disque.", "La terminaison avec tu est -es.", "Lances garde c devant e et se termine par s."),
      c("commencer", "3s", "Elle ___ son exposé.", "Devant le e final, garde c.", "Commence ne demande pas de cédille."),
      c("placer", "1p", "Nous ___ les chaises en cercle.", "Devant le o de -ons, transforme c en ç.", "Plaçons garde le son s grâce à la cédille."),
      c("annoncer", "1p", "Nous ___ le résultat.", "La fin avec nous est -çons.", "On écrit annonçons avec ç devant o."),
      c("remplacer", "1p", "Nous ___ la pile.", "Change seulement le c placé avant -ons.", "Remplaçons prend une cédille pour garder le son s."),
      c("effacer", "2p", "Vous ___ le tableau.", "Le e de -ez permet de garder c sans cédille.", "On écrit effacez, avec c devant e."),
      c("tracer", "3p", "Elles ___ une ligne.", "Avec elles, ajoute -ent ; le c reste devant e.", "Tracent ne prend pas de cédille."),
    ],
  },
  {
    key: "verb:aller", model: "aller", extraVerbs: ["parler", "lire"], title: "Choisir la bonne forme de aller au présent",
    question: "Pourquoi dit-on « je vais », mais « nous allons » ?",
    steps: [
      { exampleFr: `Je ${form("aller", "1s")} au stade. Nous ${form("aller", "1p")} au stade.`, explanationFr: "Le verbe aller change beaucoup selon le sujet. Il ne suit pas le modèle parler, même si sa forme du dictionnaire se termine par -er." },
      { exampleFr: `Tu ${form("aller", "2s")}. Elle ${form("aller", "3s")}. Ils ${form("aller", "3p")}.`, explanationFr: "Repère les différences écrites : vas avec tu, va avec elle, vont avec ils. Ces formes sont à mémoriser avec leur sujet." },
    ],
    takeaway: "Repère le sujet, puis retrouve la forme de aller qui lui correspond. Avec nous et vous, le début est all- ; les autres formes sont vais, vas, va et vont.",
    boundary: "Cette leçon travaille aller au présent. Dans « je vais lire », aller aide à construire le futur proche, mais l’emploi de ce temps est une autre compétence.",
    cases: [
      c("aller", "1s", "Je ___ à la bibliothèque.", "Avec je, la forme commence par v et finit par -ais.", "La forme avec je est vais."),
      c("aller", "2s", "Tu ___ au gymnase.", "Avec tu, pense au s final.", "La forme avec tu est vas."),
      c("aller", "3s", "On ___ au cinéma.", "On utilise la même forme que il ou elle.", "La forme avec on est va, sans s."),
      c("aller", "1p", "Nous ___ au marché.", "Le début all- est suivi de -ons.", "La forme avec nous est allons."),
      c("aller", "2p", "Vous ___ à la piscine.", "Le début all- est suivi de -ez.", "La forme avec vous est allez."),
      c("aller", "3p", "Elles ___ au parc.", "La forme commence par v et finit par -ont.", "La forme avec elles est vont."),
    ],
  },
  {
    key: "verb:faire", model: "faire", title: "Choisir la bonne forme de faire au présent",
    question: "Comment passer de « je fais » à « vous faites » ?",
    steps: [
      { exampleFr: `Je ${form("faire", "1s")} un dessin. Vous ${form("faire", "2p")} un dessin.`, explanationFr: "Faire ne suit pas une seule règle de terminaison. La forme avec vous est faites : on ne peut pas la construire en ajoutant simplement -ez." },
      { exampleFr: `Tu ${form("faire", "2s")}. Il ${form("faire", "3s")}. Ils ${form("faire", "3p")}.`, explanationFr: "Fais et fait se ressemblent à l’oral, mais changent à l’écrit : s avec tu, t avec il. Avec ils, la forme est font." },
    ],
    takeaway: "Mémorise chaque forme avec son sujet. Surveille surtout fait, faites et font, qui ne se construisent pas comme un verbe régulier en -er.",
    boundary: "Ces formes concernent faire au présent. Elles ne prouvent pas que tu sais former le futur, le passé composé ou les autres temps de faire.",
    cases: [
      c("faire", "1s", "Je ___ une maquette.", "Avec je, la forme se termine par s.", "La forme avec je est fais."),
      c("faire", "2s", "Tu ___ une pause.", "Avec tu, on écrit la même forme qu’avec je.", "La forme avec tu est fais."),
      c("faire", "3s", "Elle ___ du vélo.", "Avec elle, pense au t final.", "La forme avec elle est fait."),
      c("faire", "1p", "Nous ___ un gâteau.", "Le début fais- est suivi de -ons.", "La forme avec nous est faisons."),
      c("faire", "2p", "Vous ___ un puzzle.", "La forme particulière avec vous est faites.", "On écrit faites, et non faisez."),
      c("faire", "3p", "Ils ___ une expérience.", "La forme avec ils se termine par -ont.", "La forme avec ils est font."),
    ],
  },
  {
    key: "verb:être", model: "être", title: "Choisir la bonne forme de être au présent",
    question: "Comment écrire être quand le sujet change ?",
    steps: [{exampleFr: "Je suis prêt. Nous sommes prêts.", explanationFr: "Être sert ici à dire comment se trouvent les personnes. Sa forme change avec le sujet ; on ne peut pas garder un seul début et ajouter les terminaisons de parler."}, {exampleFr: "Tu es calme. Elle est calme.", explanationFr: "Es et est se prononcent souvent de la même façon. À l’écrit, tu demande es et elle demande est. Le t appartient au verbe avec il, elle ou on."}],
    takeaway: "Repère le sujet avant de choisir la forme de être. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur être au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("être","1s","Je ___ dans le jardin.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, être s’écrit suis."),
      c("être","2s","Tu ___ au premier rang.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, être s’écrit es."),
      c("être","3s","Elle ___ contente de son dessin.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, être s’écrit est."),
      c("être","1p","Nous ___ en avance.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, être s’écrit sommes."),
      c("être","2p","Vous ___ près de la porte.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, être s’écrit êtes."),
      c("être","3p","Ils ___ dans la même équipe.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, être s’écrit sont."),
    ],
  },
  {
    key: "verb:avoir", model: "avoir", title: "Choisir la bonne forme de avoir au présent",
    question: "Comment écrire avoir quand le sujet change ?",
    steps: [{exampleFr: "J’ai une idée. Nous avons une idée.", explanationFr: "Avoir exprime ici ce que chacun possède. Avec je, on écrit j’ai : le e de je disparaît devant la voyelle. Le verbe seul s’écrit ai."}, {exampleFr: "Tu as un carnet. Elle a un carnet.", explanationFr: "Avec tu, as prend un s. Avec elle, a n’en prend pas. La forme ils ont est différente du mot on, qui peut être un sujet."}],
    takeaway: "Repère le sujet avant de choisir la forme de avoir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur avoir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("avoir","1s","J’___ une lampe de poche.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, avoir s’écrit ai."),
      c("avoir","2s","Tu ___ une nouvelle question.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, avoir s’écrit as."),
      c("avoir","3s","On ___ assez de papier.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, avoir s’écrit a."),
      c("avoir","1p","Nous ___ des places pour le concert.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, avoir s’écrit avons."),
      c("avoir","2p","Vous ___ le même horaire.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, avoir s’écrit avez."),
      c("avoir","3p","Elles ___ un projet commun.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, avoir s’écrit ont."),
    ],
  },
  {
    key: "verb:prendre", model: "prendre", title: "Choisir la bonne forme de prendre au présent",
    question: "Comment écrire prendre quand le sujet change ?",
    steps: [{exampleFr: "Je prends mon sac. Nous prenons nos sacs.", explanationFr: "Au singulier, on garde le d dans prends et prend. Avec nous et vous, le d disparaît : prenons, prenez."}, {exampleFr: "Elle prend le bus. Elles prennent le bus.", explanationFr: "Avec elles, prennent s’écrit avec deux n. Ne recopie pas simplement la forme du singulier en ajoutant -ent."}],
    takeaway: "Repère le sujet avant de choisir la forme de prendre. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur prendre au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("prendre","1s","Je ___ un livre sur l’étagère.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, prendre s’écrit prends."),
      c("prendre","2s","Tu ___ le chemin du parc.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, prendre s’écrit prends."),
      c("prendre","3s","Elle ___ une photo.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, prendre s’écrit prend."),
      c("prendre","1p","Nous ___ notre temps.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, prendre s’écrit prenons."),
      c("prendre","2p","Vous ___ le train du soir.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, prendre s’écrit prenez."),
      c("prendre","3p","Ils ___ des notes.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, prendre s’écrit prennent."),
    ],
  },
  {
    key: "verb:venir", model: "venir", title: "Choisir la bonne forme de venir au présent",
    question: "Comment écrire venir quand le sujet change ?",
    steps: [{exampleFr: "Je viens au club. Nous venons au club.", explanationFr: "Le début change : vien- au singulier, ven- avec nous et vous. Ces débuts du verbe s’appellent des radicaux."}, {exampleFr: "Elle vient demain. Elles viennent demain.", explanationFr: "Avec il, elle ou on, vient finit par t. Avec ils ou elles, viennent contient deux n. Le présent peut ici parler d’un déplacement prévu pour demain."}],
    takeaway: "Repère le sujet avant de choisir la forme de venir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur venir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("venir","1s","Je ___ voir ton exposition.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, venir s’écrit viens."),
      c("venir","2s","Tu ___ avec ton frère.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, venir s’écrit viens."),
      c("venir","3s","On ___ à pied.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, venir s’écrit vient."),
      c("venir","1p","Nous ___ de la bibliothèque.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, venir s’écrit venons."),
      c("venir","2p","Vous ___ au bon moment.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, venir s’écrit venez."),
      c("venir","3p","Elles ___ chercher leurs cahiers.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, venir s’écrit viennent."),
    ],
  },
  {
    key: "verb:partir", model: "partir", title: "Choisir la bonne forme de partir au présent",
    question: "Comment écrire partir quand le sujet change ?",
    steps: [{exampleFr: "Je pars tôt. Nous partons tôt.", explanationFr: "Le t de partir disparaît dans je pars et tu pars. Il reste dans il part et dans les formes avec nous, vous, ils ou elles."}, {exampleFr: "Tu pars. Il part.", explanationFr: "Le s de pars et le t de part ne s’entendent généralement pas. Le sujet permet de choisir la bonne lettre à l’écrit."}],
    takeaway: "Repère le sujet avant de choisir la forme de partir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur partir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("partir","1s","Je ___ après le déjeuner.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, partir s’écrit pars."),
      c("partir","2s","Tu ___ en randonnée.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, partir s’écrit pars."),
      c("partir","3s","Elle ___ avec sa tante.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, partir s’écrit part."),
      c("partir","1p","Nous ___ dans dix minutes.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, partir s’écrit partons."),
      c("partir","2p","Vous ___ par cette sortie.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, partir s’écrit partez."),
      c("partir","3p","Ils ___ ensemble.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, partir s’écrit partent."),
    ],
  },
  {
    key: "verb:sortir", model: "sortir", title: "Choisir la bonne forme de sortir au présent",
    question: "Comment écrire sortir quand le sujet change ?",
    steps: [{exampleFr: "Je sors du gymnase. Nous sortons du gymnase.", explanationFr: "Avec je et tu, on écrit sors sans t. Le t revient dans sort, sortons, sortez et sortent."}, {exampleFr: "Elle sort son cahier. Elles sortent leurs cahiers.", explanationFr: "Le verbe garde les mêmes formes au présent, qu’il indique quitter un lieu ou retirer un objet. Le choix d’un auxiliaire au passé composé est une autre question."}],
    takeaway: "Repère le sujet avant de choisir la forme de sortir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur sortir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("sortir","1s","Je ___ de la classe.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, sortir s’écrit sors."),
      c("sortir","2s","Tu ___ une feuille de ton sac.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, sortir s’écrit sors."),
      c("sortir","3s","On ___ dans la cour.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, sortir s’écrit sort."),
      c("sortir","1p","Nous ___ les chaises.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, sortir s’écrit sortons."),
      c("sortir","2p","Vous ___ après le signal.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, sortir s’écrit sortez."),
      c("sortir","3p","Elles ___ du cinéma.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, sortir s’écrit sortent."),
    ],
  },
  {
    key: "verb:dire", model: "dire", title: "Choisir la bonne forme de dire au présent",
    question: "Comment écrire dire quand le sujet change ?",
    steps: [{exampleFr: "Je dis merci. Vous dites merci.", explanationFr: "Avec vous, la forme est dites. On ne construit pas cette forme en ajoutant -ez au début dis-."}, {exampleFr: "Tu dis la réponse. Elle dit la réponse.", explanationFr: "Le verbe se termine par s avec tu et par t avec elle. Avec nous et ils, on retrouve dis- dans disons et disent."}],
    takeaway: "Repère le sujet avant de choisir la forme de dire. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur dire au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("dire","1s","Je ___ ce que je pense.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, dire s’écrit dis."),
      c("dire","2s","Tu ___ bonjour à la voisine.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, dire s’écrit dis."),
      c("dire","3s","Il ___ son prénom.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, dire s’écrit dit."),
      c("dire","1p","Nous ___ la vérité.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, dire s’écrit disons."),
      c("dire","2p","Vous ___ la même chose.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, dire s’écrit dites."),
      c("dire","3p","Elles ___ quelques mots.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, dire s’écrit disent."),
    ],
  },
  {
    key: "verb:voir", model: "voir", title: "Choisir la bonne forme de voir au présent",
    question: "Comment écrire voir quand le sujet change ?",
    steps: [{exampleFr: "Je vois la scène. Nous voyons la scène.", explanationFr: "Avec nous et vous, le i devient y : voyons, voyez. Avec ils ou elles, on revient à voi- dans voient."}, {exampleFr: "Tu vois la lune. Elle voit la lune.", explanationFr: "Vois prend un s avec je et tu. Voit prend un t avec il, elle ou on. Ces lettres écrites distinguent des formes qui se ressemblent à l’oral."}],
    takeaway: "Repère le sujet avant de choisir la forme de voir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur voir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("voir","1s","Je ___ le panneau.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, voir s’écrit vois."),
      c("voir","2s","Tu ___ une étoile.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, voir s’écrit vois."),
      c("voir","3s","On ___ la rivière.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, voir s’écrit voit."),
      c("voir","1p","Nous ___ les joueurs de près.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, voir s’écrit voyons."),
      c("voir","2p","Vous ___ le dessin en entier.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, voir s’écrit voyez."),
      c("voir","3p","Ils ___ leurs amis arriver.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, voir s’écrit voient."),
    ],
  },
  {
    key: "verb:pouvoir", model: "pouvoir", title: "Choisir la bonne forme de pouvoir au présent",
    question: "Comment écrire pouvoir quand le sujet change ?",
    steps: [{exampleFr: "Je peux venir. Nous pouvons venir.", explanationFr: "Pouvoir indique ici une possibilité. Le début est peu- au singulier, pouv- avec nous et vous, puis peuv- avec ils ou elles."}, {exampleFr: "Tu peux essayer. Elle peut essayer.", explanationFr: "Peux finit par x avec je et tu ; peut finit par t avec elle. Le verbe qui suit, essayer, reste ici à la forme du dictionnaire, appelée infinitif."}],
    takeaway: "Repère le sujet avant de choisir la forme de pouvoir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur pouvoir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("pouvoir","1s","Je ___ ouvrir la fenêtre.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, pouvoir s’écrit peux."),
      c("pouvoir","2s","Tu ___ choisir une couleur.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, pouvoir s’écrit peux."),
      c("pouvoir","3s","Elle ___ nous aider.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, pouvoir s’écrit peut."),
      c("pouvoir","1p","Nous ___ rester ici.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, pouvoir s’écrit pouvons."),
      c("pouvoir","2p","Vous ___ recommencer.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, pouvoir s’écrit pouvez."),
      c("pouvoir","3p","Ils ___ entrer maintenant.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, pouvoir s’écrit peuvent."),
    ],
  },
  {
    key: "verb:vouloir", model: "vouloir", title: "Choisir la bonne forme de vouloir au présent",
    question: "Comment écrire vouloir quand le sujet change ?",
    steps: [{exampleFr: "Je veux apprendre. Nous voulons apprendre.", explanationFr: "Vouloir exprime ici ce que les personnes souhaitent. Le début change selon le sujet : veu-, voul- ou veul-."}, {exampleFr: "Tu veux jouer. Elle veut jouer.", explanationFr: "Avec tu, veux prend un x. Avec elle, veut prend un t. Avec ils ou elles, on écrit veulent avec un l."}],
    takeaway: "Repère le sujet avant de choisir la forme de vouloir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur vouloir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("vouloir","1s","Je ___ lire ce manga.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, vouloir s’écrit veux."),
      c("vouloir","2s","Tu ___ préparer l’affiche.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, vouloir s’écrit veux."),
      c("vouloir","3s","On ___ essayer autrement.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, vouloir s’écrit veut."),
      c("vouloir","1p","Nous ___ comprendre la règle.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, vouloir s’écrit voulons."),
      c("vouloir","2p","Vous ___ rejoindre le groupe.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, vouloir s’écrit voulez."),
      c("vouloir","3p","Elles ___ organiser un tournoi.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, vouloir s’écrit veulent."),
    ],
  },
  {
    key: "verb:savoir", model: "savoir", title: "Choisir la bonne forme de savoir au présent",
    question: "Comment écrire savoir quand le sujet change ?",
    steps: [{exampleFr: "Je sais nager. Nous savons nager.", explanationFr: "Savoir indique ici ce que les personnes savent faire. Le début sai- du singulier devient sav- avec nous, vous, ils et elles."}, {exampleFr: "Tu sais la réponse. Elle sait la réponse.", explanationFr: "Avec je et tu, sais finit par s. Avec il, elle ou on, sait finit par t. Le sujet permet de choisir la lettre finale."}],
    takeaway: "Repère le sujet avant de choisir la forme de savoir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur savoir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("savoir","1s","Je ___ où se trouve la salle.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, savoir s’écrit sais."),
      c("savoir","2s","Tu ___ réparer ce vélo.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, savoir s’écrit sais."),
      c("savoir","3s","Il ___ son texte par cœur.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, savoir s’écrit sait."),
      c("savoir","1p","Nous ___ utiliser cette application.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, savoir s’écrit savons."),
      c("savoir","2p","Vous ___ comment commencer.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, savoir s’écrit savez."),
      c("savoir","3p","Elles ___ jouer aux échecs.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, savoir s’écrit savent."),
    ],
  },
  {
    key: "verb:devoir", model: "devoir", title: "Choisir la bonne forme de devoir au présent",
    question: "Comment écrire devoir quand le sujet change ?",
    steps: [{exampleFr: "Je dois partir. Nous devons partir.", explanationFr: "Devoir exprime ici une obligation. Le début est doi- au singulier, dev- avec nous et vous, puis doiv- avec ils ou elles."}, {exampleFr: "Tu dois attendre. Elle doit attendre.", explanationFr: "Dois prend un s avec je et tu. Doit prend un t avec elle. Dans doivent, on conserve oi et on ajoute v avant -ent."}],
    takeaway: "Repère le sujet avant de choisir la forme de devoir. Vérifie le début du verbe et sa lettre finale.",
    boundary: "Cette leçon porte sur devoir au présent de l’indicatif. Les autres temps et les autres verbes seront travaillés et vérifiés séparément.",
    cases: [
      c("devoir","1s","Je ___ rendre ce livre.","Repère le sujet. Dans le tableau, retrouve la forme avec je.","Avec je, devoir s’écrit dois."),
      c("devoir","2s","Tu ___ vérifier ton calcul.","Repère le sujet. Dans le tableau, retrouve la forme avec tu.","Avec tu, devoir s’écrit dois."),
      c("devoir","3s","On ___ ranger le matériel.","Repère le sujet. Dans le tableau, retrouve la forme avec il, elle ou on.","Avec il, elle ou on, devoir s’écrit doit."),
      c("devoir","1p","Nous ___ terminer l’affiche.","Repère le sujet. Dans le tableau, retrouve la forme avec nous.","Avec nous, devoir s’écrit devons."),
      c("devoir","2p","Vous ___ suivre ce chemin.","Repère le sujet. Dans le tableau, retrouve la forme avec vous.","Avec vous, devoir s’écrit devez."),
      c("devoir","3p","Ils ___ prévenir leur équipe.","Repère le sujet. Dans le tableau, retrouve la forme avec ils ou elles.","Avec ils ou elles, devoir s’écrit doivent."),
    ],
  },
];

export const CONJUGATION_TEACHING: readonly TargetTeachingContent[] = CONJUGATION_TEACHING_CASES.map(draft => {
  const practice = draft.cases.map((item, i) => {
    const answerFr = form(item.verb, item.person);
    return { id: `guided:present:${draft.key}:${i + 1}`, promptFr: `Conjugue ${item.verb} au présent. Écris seulement le verbe : ${item.sentence}`,
      answerFr, hintFr: item.hint, explanationFr: `${item.sentence.replace("___", answerFr)} ${item.why}` };
  });
  const paradigms = PERSONS.map(person => `${subjects[person]} : ${form(draft.model, person)}`).join("\n");
  return {
    id: `french-v3-teaching:present:${draft.key}`, nodeKey: "produire_present_indicatif", facetKey: `produire_present_indicatif::${draft.key}`,
    mode: "production", status: "draft_requires_review", titleFr: draft.title, learnerQuestionFr: draft.question,
    steps: [...draft.steps, { exampleFr: paradigms, explanationFr: `Les six formes de ${draft.model} servent de repères. Le tableau aide à s’entraîner ; le regarder ne suffit pas à montrer que tu sais les retrouver sans aide.` }],
    takeawayFr: draft.takeaway, boundaryFr: draft.boundary, practice,
    materialExposure: {
      words: [...new Set([draft.model, ...draft.cases.map(item => item.verb), ...(draft.extraVerbs ?? [])])].map(lemma => ({ lemma, form: lemma })),
      sentences: [...draft.steps.map(step => step.exampleFr), ...draft.cases.map((item, i) => item.sentence.replace("___", practice[i].answerFr))],
    },
  };
});
