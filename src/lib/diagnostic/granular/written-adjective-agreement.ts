import type {TargetTeachingContent} from "./teaching-content";

export const WRITTEN_ADJECTIVE_DRAFTS = [
  {
    "key": "recognition-1",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "profond",
    "source": "La rivière est ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLa rivière est ___.",
    "answer": "profonde",
    "distractors": [
      "profond",
      "profonds",
      "profondes"
    ],
    "forms": [
      "profond",
      "profonde",
      "profonds",
      "profondes"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-gender-and-number",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « profonde ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-2",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "sinueux",
    "source": "Les chemins sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes chemins sont ___.",
    "answer": "sinueux",
    "distractors": [
      "sinueuse",
      "sinueuses"
    ],
    "forms": [
      "sinueux",
      "sinueuse",
      "sinueuses"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « sinueux ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-3",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "attentif",
    "source": "Les habitantes sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes habitantes sont ___.",
    "answer": "attentives",
    "distractors": [
      "attentif",
      "attentive",
      "attentifs"
    ],
    "forms": [
      "attentif",
      "attentive",
      "attentifs",
      "attentives"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « attentives ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-4",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "inquiet",
    "source": "Le témoin semble ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLe témoin semble ___.",
    "answer": "inquiet",
    "distractors": [
      "inquiète",
      "inquiets",
      "inquiètes"
    ],
    "forms": [
      "inquiet",
      "inquiète",
      "inquiets",
      "inquiètes"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-number",
      "wrong-gender-and-number"
    ],
    "reason": "La forme attendue dans cette phrase est « inquiet ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-5",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "précis",
    "source": "Les réponses sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes réponses sont ___.",
    "answer": "précises",
    "distractors": [
      "précis",
      "précise"
    ],
    "forms": [
      "précis",
      "précise",
      "précises"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « précises ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-6",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "heureux",
    "source": "La bergère paraît ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLa bergère paraît ___.",
    "answer": "heureuse",
    "distractors": [
      "heureux",
      "heureuses"
    ],
    "forms": [
      "heureux",
      "heureuse",
      "heureuses"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « heureuse ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-7",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "silencieux",
    "source": "Les garçons restent ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes garçons restent ___.",
    "answer": "silencieux",
    "distractors": [
      "silencieuse",
      "silencieuses"
    ],
    "forms": [
      "silencieux",
      "silencieuse",
      "silencieuses"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « silencieux ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-8",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "obscur",
    "source": "La ruelle est ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLa ruelle est ___.",
    "answer": "obscure",
    "distractors": [
      "obscur",
      "obscurs",
      "obscures"
    ],
    "forms": [
      "obscur",
      "obscure",
      "obscurs",
      "obscures"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-gender-and-number",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « obscure ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-9",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "dangereux",
    "source": "Les routes deviennent ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes routes deviennent ___.",
    "answer": "dangereuses",
    "distractors": [
      "dangereux",
      "dangereuse"
    ],
    "forms": [
      "dangereux",
      "dangereuse",
      "dangereuses"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « dangereuses ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-10",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "confus",
    "source": "Le discours paraît ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLe discours paraît ___.",
    "answer": "confus",
    "distractors": [
      "confuse",
      "confuses"
    ],
    "forms": [
      "confus",
      "confuse",
      "confuses"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-gender-and-number"
    ],
    "reason": "La forme attendue dans cette phrase est « confus ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-11",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "expressif",
    "source": "Les comédiennes sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes comédiennes sont ___.",
    "answer": "expressives",
    "distractors": [
      "expressif",
      "expressive",
      "expressifs"
    ],
    "forms": [
      "expressif",
      "expressive",
      "expressifs",
      "expressives"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « expressives ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-12",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "définitif",
    "source": "La décision semble ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLa décision semble ___.",
    "answer": "définitive",
    "distractors": [
      "définitif",
      "définitifs",
      "définitives"
    ],
    "forms": [
      "définitif",
      "définitive",
      "définitifs",
      "définitives"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-gender-and-number",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « définitive ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-13",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "moelleux",
    "source": "Les coussins sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes coussins sont ___.",
    "answer": "moelleux",
    "distractors": [
      "moelleuse",
      "moelleuses"
    ],
    "forms": [
      "moelleux",
      "moelleuse",
      "moelleuses"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « moelleux ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-14",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "craintif",
    "source": "La chienne paraît ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLa chienne paraît ___.",
    "answer": "craintive",
    "distractors": [
      "craintif",
      "craintifs",
      "craintives"
    ],
    "forms": [
      "craintif",
      "craintive",
      "craintifs",
      "craintives"
    ],
    "errorKeys": [
      "wrong-gender",
      "wrong-gender-and-number",
      "wrong-number"
    ],
    "reason": "La forme attendue dans cette phrase est « craintive ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-15",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "sportif",
    "source": "Les nageuses sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes nageuses sont ___.",
    "answer": "sportives",
    "distractors": [
      "sportif",
      "sportive",
      "sportifs"
    ],
    "forms": [
      "sportif",
      "sportive",
      "sportifs",
      "sportives"
    ],
    "errorKeys": [
      "wrong-gender-and-number",
      "wrong-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « sportives ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "recognition-16",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "lemma": "délicat",
    "source": "Les tissus sont ___.",
    "prompt": "Choisis la forme de l’adjectif qui convient.\n\nLes tissus sont ___.",
    "answer": "délicats",
    "distractors": [
      "délicat",
      "délicate",
      "délicates"
    ],
    "forms": [
      "délicat",
      "délicate",
      "délicats",
      "délicates"
    ],
    "errorKeys": [
      "wrong-number",
      "wrong-gender-and-number",
      "wrong-gender"
    ],
    "reason": "La forme attendue dans cette phrase est « délicats ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-17",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "discret",
    "source": "La voisine semble ___.",
    "prompt": "Complète avec « discret » correctement accordé. Écris seulement l’adjectif.\n\nLa voisine semble ___.",
    "answer": "discrète",
    "distractors": [
      "discret",
      "discrets",
      "discrètes"
    ],
    "forms": [
      "discret",
      "discrète",
      "discrets",
      "discrètes"
    ],
    "errorKeys": [
      "wrong-agreement-discret",
      "wrong-agreement-discrets",
      "wrong-agreement-discrètes"
    ],
    "reason": "La forme attendue dans cette phrase est « discrète ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-18",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "curieux",
    "source": "Les randonneuses sont ___.",
    "prompt": "Complète avec « curieux » correctement accordé. Écris seulement l’adjectif.\n\nLes randonneuses sont ___.",
    "answer": "curieuses",
    "distractors": [
      "curieux",
      "curieuse"
    ],
    "forms": [
      "curieux",
      "curieuse",
      "curieuses"
    ],
    "errorKeys": [
      "wrong-agreement-curieux",
      "wrong-agreement-curieuse"
    ],
    "reason": "La forme attendue dans cette phrase est « curieuses ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-19",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "bref",
    "source": "Les commentaires sont ___.",
    "prompt": "Complète avec « bref » correctement accordé. Écris seulement l’adjectif.\n\nLes commentaires sont ___.",
    "answer": "brefs",
    "distractors": [
      "bref",
      "brève",
      "brèves"
    ],
    "forms": [
      "bref",
      "brève",
      "brefs",
      "brèves"
    ],
    "errorKeys": [
      "wrong-agreement-bref",
      "wrong-agreement-brève",
      "wrong-agreement-brèves"
    ],
    "reason": "La forme attendue dans cette phrase est « brefs ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-20",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "vigilant",
    "source": "La surveillante reste ___.",
    "prompt": "Complète avec « vigilant » correctement accordé. Écris seulement l’adjectif.\n\nLa surveillante reste ___.",
    "answer": "vigilante",
    "distractors": [
      "vigilant",
      "vigilants",
      "vigilantes"
    ],
    "forms": [
      "vigilant",
      "vigilante",
      "vigilants",
      "vigilantes"
    ],
    "errorKeys": [
      "wrong-agreement-vigilant",
      "wrong-agreement-vigilants",
      "wrong-agreement-vigilantes"
    ],
    "reason": "La forme attendue dans cette phrase est « vigilante ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-21",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "lointain",
    "source": "Les montagnes paraissent ___.",
    "prompt": "Complète avec « lointain » correctement accordé. Écris seulement l’adjectif.\n\nLes montagnes paraissent ___.",
    "answer": "lointaines",
    "distractors": [
      "lointain",
      "lointaine",
      "lointains"
    ],
    "forms": [
      "lointain",
      "lointaine",
      "lointains",
      "lointaines"
    ],
    "errorKeys": [
      "wrong-agreement-lointain",
      "wrong-agreement-lointaine",
      "wrong-agreement-lointains"
    ],
    "reason": "La forme attendue dans cette phrase est « lointaines ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-22",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "patient",
    "source": "Le visiteur est ___.",
    "prompt": "Complète avec « patient » correctement accordé. Écris seulement l’adjectif.\n\nLe visiteur est ___.",
    "answer": "patient",
    "distractors": [
      "patiente",
      "patients",
      "patientes"
    ],
    "forms": [
      "patient",
      "patiente",
      "patients",
      "patientes"
    ],
    "errorKeys": [
      "wrong-agreement-patiente",
      "wrong-agreement-patients",
      "wrong-agreement-patientes"
    ],
    "reason": "La forme attendue dans cette phrase est « patient ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-23",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "neuf",
    "source": "Les vestes sont ___.",
    "prompt": "Complète avec « neuf » correctement accordé. Écris seulement l’adjectif.\n\nLes vestes sont ___.",
    "answer": "neuves",
    "distractors": [
      "neuf",
      "neuve",
      "neufs"
    ],
    "forms": [
      "neuf",
      "neuve",
      "neufs",
      "neuves"
    ],
    "errorKeys": [
      "wrong-agreement-neuf",
      "wrong-agreement-neuve",
      "wrong-agreement-neufs"
    ],
    "reason": "La forme attendue dans cette phrase est « neuves ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-24",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "inventif",
    "source": "La cuisinière semble ___.",
    "prompt": "Complète avec « inventif » correctement accordé. Écris seulement l’adjectif.\n\nLa cuisinière semble ___.",
    "answer": "inventive",
    "distractors": [
      "inventif",
      "inventifs",
      "inventives"
    ],
    "forms": [
      "inventif",
      "inventive",
      "inventifs",
      "inventives"
    ],
    "errorKeys": [
      "wrong-agreement-inventif",
      "wrong-agreement-inventifs",
      "wrong-agreement-inventives"
    ],
    "reason": "La forme attendue dans cette phrase est « inventive ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-25",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "majestueux",
    "source": "Les châteaux sont ___.",
    "prompt": "Complète avec « majestueux » correctement accordé. Écris seulement l’adjectif.\n\nLes châteaux sont ___.",
    "answer": "majestueux",
    "distractors": [
      "majestueuse",
      "majestueuses"
    ],
    "forms": [
      "majestueux",
      "majestueuse",
      "majestueuses"
    ],
    "errorKeys": [
      "wrong-agreement-majestueuse",
      "wrong-agreement-majestueuses"
    ],
    "reason": "La forme attendue dans cette phrase est « majestueux ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-26",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "courageux",
    "source": "La navigatrice est ___.",
    "prompt": "Complète avec « courageux » correctement accordé. Écris seulement l’adjectif.\n\nLa navigatrice est ___.",
    "answer": "courageuse",
    "distractors": [
      "courageux",
      "courageuses"
    ],
    "forms": [
      "courageux",
      "courageuse",
      "courageuses"
    ],
    "errorKeys": [
      "wrong-agreement-courageux",
      "wrong-agreement-courageuses"
    ],
    "reason": "La forme attendue dans cette phrase est « courageuse ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-27",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "abondant",
    "source": "Les récoltes sont ___.",
    "prompt": "Complète avec « abondant » correctement accordé. Écris seulement l’adjectif.\n\nLes récoltes sont ___.",
    "answer": "abondantes",
    "distractors": [
      "abondant",
      "abondante",
      "abondants"
    ],
    "forms": [
      "abondant",
      "abondante",
      "abondants",
      "abondantes"
    ],
    "errorKeys": [
      "wrong-agreement-abondant",
      "wrong-agreement-abondante",
      "wrong-agreement-abondants"
    ],
    "reason": "La forme attendue dans cette phrase est « abondantes ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-28",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "positif",
    "source": "Le résultat paraît ___.",
    "prompt": "Complète avec « positif » correctement accordé. Écris seulement l’adjectif.\n\nLe résultat paraît ___.",
    "answer": "positif",
    "distractors": [
      "positive",
      "positifs",
      "positives"
    ],
    "forms": [
      "positif",
      "positive",
      "positifs",
      "positives"
    ],
    "errorKeys": [
      "wrong-agreement-positive",
      "wrong-agreement-positifs",
      "wrong-agreement-positives"
    ],
    "reason": "La forme attendue dans cette phrase est « positif ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-29",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "important",
    "source": "Les courriers sont ___.",
    "prompt": "Complète avec « important » correctement accordé. Écris seulement l’adjectif.\n\nLes courriers sont ___.",
    "answer": "importants",
    "distractors": [
      "important",
      "importante",
      "importantes"
    ],
    "forms": [
      "important",
      "importante",
      "importants",
      "importantes"
    ],
    "errorKeys": [
      "wrong-agreement-important",
      "wrong-agreement-importante",
      "wrong-agreement-importantes"
    ],
    "reason": "La forme attendue dans cette phrase est « importants ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-30",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "spacieux",
    "source": "La salle semble ___.",
    "prompt": "Complète avec « spacieux » correctement accordé. Écris seulement l’adjectif.\n\nLa salle semble ___.",
    "answer": "spacieuse",
    "distractors": [
      "spacieux",
      "spacieuses"
    ],
    "forms": [
      "spacieux",
      "spacieuse",
      "spacieuses"
    ],
    "errorKeys": [
      "wrong-agreement-spacieux",
      "wrong-agreement-spacieuses"
    ],
    "reason": "La forme attendue dans cette phrase est « spacieuse ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-31",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "mûr",
    "source": "Les pommes sont ___.",
    "prompt": "Complète avec « mûr » correctement accordé. Écris seulement l’adjectif.\n\nLes pommes sont ___.",
    "answer": "mûres",
    "distractors": [
      "mûr",
      "mûre",
      "mûrs"
    ],
    "forms": [
      "mûr",
      "mûre",
      "mûrs",
      "mûres"
    ],
    "errorKeys": [
      "wrong-agreement-mûr",
      "wrong-agreement-mûre",
      "wrong-agreement-mûrs"
    ],
    "reason": "La forme attendue dans cette phrase est « mûres ». Vérifie le genre et le nombre du nom décrit."
  },
  {
    "key": "production-32",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "lemma": "rêveur",
    "source": "Les garçons semblent ___.",
    "prompt": "Complète avec « rêveur » correctement accordé. Écris seulement l’adjectif.\n\nLes garçons semblent ___.",
    "answer": "rêveurs",
    "distractors": [
      "rêveur",
      "rêveuse",
      "rêveuses"
    ],
    "forms": [
      "rêveur",
      "rêveuse",
      "rêveurs",
      "rêveuses"
    ],
    "errorKeys": [
      "wrong-agreement-rêveur",
      "wrong-agreement-rêveuse",
      "wrong-agreement-rêveuses"
    ],
    "reason": "La forme attendue dans cette phrase est « rêveurs ». Vérifie le genre et le nombre du nom décrit."
  }
] as const;

export const WRITTEN_ADJECTIVE_TEACHING: readonly TargetTeachingContent[] = [
  {
    "id": "french-v3-teaching:written-adjective:recognition",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "recognition",
    "status": "draft_requires_review",
    "titleFr": "Choisir la bonne forme de l’adjectif",
    "learnerQuestionFr": "Quelle forme faut-il écrire pour décrire ce nom ?",
    "steps": [
      {
        "exampleFr": "Un mur blanc. Une porte blanche.",
        "explanationFr": "Blanc décrit un nom masculin ; blanche décrit un nom féminin. Le féminin ne se forme pas toujours en ajoutant seulement e."
      },
      {
        "exampleFr": "Un rideau bleu. Des rideaux bleus. Des tentures bleues.",
        "explanationFr": "L’adjectif suit le genre et le nombre du nom. Bleus porte le pluriel ; bleues porte le féminin et le pluriel."
      },
      {
        "exampleFr": "Un prix bas. Des prix bas.",
        "explanationFr": "Bas garde ici la même forme écrite au singulier et au pluriel. On ne rajoute pas un second s."
      }
    ],
    "takeawayFr": "Vérifie les deux informations : le genre et le nombre du nom.",
    "boundaryFr": "Certains adjectifs changent beaucoup au féminin ; d’autres gardent la même forme au pluriel. Ces exemples ne couvrent pas toutes les exceptions.",
    "practice": [
      {
        "id": "written-adjective:recognition:0",
        "promptFr": "Choisis la forme correcte.\n\nLa valise est ___.",
        "answerFr": "lourde",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "La valise est lourde. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "lourde",
          "lourd",
          "lourds"
        ]
      },
      {
        "id": "written-adjective:recognition:1",
        "promptFr": "Choisis la forme correcte.\n\nLes tapis sont ___.",
        "answerFr": "épais",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les tapis sont épais. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "épais",
          "épaisse",
          "épaisses"
        ]
      },
      {
        "id": "written-adjective:recognition:2",
        "promptFr": "Choisis la forme correcte.\n\nLes fenêtres sont ___.",
        "answerFr": "petites",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les fenêtres sont petites. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "petites",
          "petit",
          "petits"
        ]
      },
      {
        "id": "written-adjective:recognition:3",
        "promptFr": "Choisis la forme correcte.\n\nLa couverture est ___.",
        "answerFr": "douce",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "La couverture est douce. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "douce",
          "doux",
          "douces"
        ]
      },
      {
        "id": "written-adjective:recognition:4",
        "promptFr": "Choisis la forme correcte.\n\nLes jardins sont ___.",
        "answerFr": "fleuris",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les jardins sont fleuris. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "fleuris",
          "fleurie",
          "fleuries"
        ]
      },
      {
        "id": "written-adjective:recognition:5",
        "promptFr": "Choisis la forme correcte.\n\nLes musiciennes sont ___.",
        "answerFr": "talentueuses",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les musiciennes sont talentueuses. L’adjectif prend la forme qui convient au nom.",
        "choices": [
          "talentueuses",
          "talentueux",
          "talentueuse"
        ]
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "lourd",
          "form": "lourde"
        },
        {
          "lemma": "épais",
          "form": "épais"
        },
        {
          "lemma": "petit",
          "form": "petites"
        },
        {
          "lemma": "doux",
          "form": "douce"
        },
        {
          "lemma": "fleuri",
          "form": "fleuris"
        },
        {
          "lemma": "talentueux",
          "form": "talentueuses"
        }
      ]
    }
  },
  {
    "id": "french-v3-teaching:written-adjective:production",
    "nodeKey": "accorder_adjectif_nom_ecrit",
    "mode": "production",
    "status": "draft_requires_review",
    "titleFr": "Écrire la bonne forme de l’adjectif",
    "learnerQuestionFr": "Quelle forme faut-il écrire pour décrire ce nom ?",
    "steps": [
      {
        "exampleFr": "Un mur blanc. Une porte blanche.",
        "explanationFr": "Blanc décrit un nom masculin ; blanche décrit un nom féminin. Le féminin ne se forme pas toujours en ajoutant seulement e."
      },
      {
        "exampleFr": "Un rideau bleu. Des rideaux bleus. Des tentures bleues.",
        "explanationFr": "L’adjectif suit le genre et le nombre du nom. Bleus porte le pluriel ; bleues porte le féminin et le pluriel."
      },
      {
        "exampleFr": "Un prix bas. Des prix bas.",
        "explanationFr": "Bas garde ici la même forme écrite au singulier et au pluriel. On ne rajoute pas un second s."
      }
    ],
    "takeawayFr": "Vérifie les deux informations : le genre et le nombre du nom.",
    "boundaryFr": "Certains adjectifs changent beaucoup au féminin ; d’autres gardent la même forme au pluriel. Ces exemples ne couvrent pas toutes les exceptions.",
    "practice": [
      {
        "id": "written-adjective:production:0",
        "promptFr": "Complète avec « lourd » correctement accordé.\n\nLa valise est ___.",
        "answerFr": "lourde",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "La valise est lourde. L’adjectif prend la forme qui convient au nom."
      },
      {
        "id": "written-adjective:production:1",
        "promptFr": "Complète avec « épais » correctement accordé.\n\nLes tapis sont ___.",
        "answerFr": "épais",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les tapis sont épais. L’adjectif prend la forme qui convient au nom."
      },
      {
        "id": "written-adjective:production:2",
        "promptFr": "Complète avec « petit » correctement accordé.\n\nLes fenêtres sont ___.",
        "answerFr": "petites",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les fenêtres sont petites. L’adjectif prend la forme qui convient au nom."
      },
      {
        "id": "written-adjective:production:3",
        "promptFr": "Complète avec « doux » correctement accordé.\n\nLa couverture est ___.",
        "answerFr": "douce",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "La couverture est douce. L’adjectif prend la forme qui convient au nom."
      },
      {
        "id": "written-adjective:production:4",
        "promptFr": "Complète avec « fleuri » correctement accordé.\n\nLes jardins sont ___.",
        "answerFr": "fleuris",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les jardins sont fleuris. L’adjectif prend la forme qui convient au nom."
      },
      {
        "id": "written-adjective:production:5",
        "promptFr": "Complète avec « talentueux » correctement accordé.\n\nLes musiciennes sont ___.",
        "answerFr": "talentueuses",
        "hintFr": "Repère le nom décrit. Est-il masculin ou féminin ? Singulier ou pluriel ?",
        "explanationFr": "Les musiciennes sont talentueuses. L’adjectif prend la forme qui convient au nom."
      }
    ],
    "materialExposure": {
      "words": [
        {
          "lemma": "lourd",
          "form": "lourde"
        },
        {
          "lemma": "épais",
          "form": "épais"
        },
        {
          "lemma": "petit",
          "form": "petites"
        },
        {
          "lemma": "doux",
          "form": "douce"
        },
        {
          "lemma": "fleuri",
          "form": "fleuris"
        },
        {
          "lemma": "talentueux",
          "form": "talentueuses"
        }
      ]
    }
  }
];
