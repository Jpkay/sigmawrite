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
