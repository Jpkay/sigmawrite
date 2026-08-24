import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type { CanonicalDiagnosticBankItem } from "./item-bank";

type SpellingExample = {
  receptivePrompt: string;
  correct: string;
  distractors: readonly [string, string];
  productionPrompt: string;
  productionAnswer: string;
};

const EXAMPLES: Readonly<Record<string, readonly [SpellingExample, SpellingExample, SpellingExample]>> = {
  segmenter_syllabes_ecrites: [
    example("Quelle segmentation écrite de « maison » est correcte ?", "mai-son", ["ma-is-on", "mais-on"], "Sépare « maison » en syllabes écrites avec un trait d’union.", "mai-son"),
    example("Quelle segmentation écrite de « tomate » est correcte ?", "to-ma-te", ["tom-ate", "to-mat-e"], "Sépare « tomate » en syllabes écrites avec des traits d’union.", "to-ma-te"),
    example("Quelle segmentation écrite de « musique » est correcte ?", "mu-si-que", ["mus-ique", "mu-siq-ue"], "Sépare « musique » en syllabes écrites avec des traits d’union.", "mu-si-que"),
  ],
  associer_phoneme_graphie_frequente: [
    example("Quelle graphie transcrit le son /ʃ/ au début de « chat » ?", "ch", ["sh", "sch"], "Écris la graphie française habituelle du son /ʃ/ dans le mot entendu « chat ».", "ch"),
    example("Quelle graphie transcrit le son /f/ dans « phare » ?", "ph", ["ff", "fh"], "Écris la graphie du son /f/ au début du mot qui désigne une tour lumineuse pour les bateaux.", "ph"),
    example("Quelle graphie transcrit le son /ɲ/ dans « montagne » ?", "gn", ["ni", "ng"], "Écris la graphie du son /ɲ/ dans le mot « montagne ».", "gn"),
  ],
  orthographier_o_au_eau: [
    example("Quel mot est correctement orthographié ?", "bateau", ["bato", "batau"], "Écris correctement le mot /bato/ qui désigne un véhicule sur l’eau.", "bateau"),
    example("Complète correctement : Il fait ___.", "chaud", ["cho", "cheau"], "Écris correctement l’adjectif /ʃo/ dans « Il fait … ».", "chaud"),
    example("Quel mot est correctement orthographié ?", "vélo", ["vélau", "véleau"], "Écris correctement le mot /velo/ qui désigne un véhicule à deux roues.", "vélo"),
  ],
  orthographier_k_c_qu: [
    example("Quel mot est correctement orthographié ?", "camion", ["kamion", "quamion"], "Écris correctement le mot /kamjɔ̃/ qui désigne un grand véhicule routier.", "camion"),
    example("Quelle forme complète correctement : ___ vient demain ?", "Qui", ["Ki", "Ci"], "Écris le pronom interrogatif /ki/ dans « … vient demain ? ».", "Qui"),
    example("Quel mot est correctement orthographié ?", "kilo", ["quilo", "cilo"], "Écris correctement l’unité de masse courante prononcée /kilo/.", "kilo"),
  ],
  orthographier_g_ge_gu: [
    example("Quel mot est correctement orthographié ?", "guitare", ["gitare", "geuitare"], "Écris correctement le nom de l’instrument à cordes prononcé /gitar/.", "guitare"),
    example("Complète correctement : Nous ___.", "mangeons", ["mangons", "manjeons"], "Écris la forme de « manger » au présent avec « nous ».", "mangeons"),
    example("Quel mot est correctement orthographié ?", "guerre", ["gerre", "guer"], "Écris correctement le mot /gɛʁ/ qui signifie un conflit armé.", "guerre"),
  ],
  orthographier_s_ss_c: [
    example("Quel mot est correctement orthographié ?", "poisson", ["poison", "poissson"], "Écris correctement le mot /pwasɔ̃/ qui désigne un animal aquatique.", "poisson"),
    example("Quel mot est correctement orthographié ?", "maison", ["maisson", "maizon"], "Écris correctement le mot /mɛzɔ̃/ qui désigne un logement.", "maison"),
    example("Quel mot est correctement orthographié ?", "citron", ["sitron", "ssitron"], "Écris correctement le nom du fruit jaune et acide prononcé /sitʁɔ̃/.", "citron"),
  ],
  orthographier_nasale_an_en: [
    example("Quel mot est correctement orthographié ?", "enfant", ["anfant", "enfen"], "Écris correctement le mot /ɑ̃fɑ̃/ désignant une jeune personne.", "enfant"),
    example("Quel mot est correctement orthographié ?", "chambre", ["chanbre", "chembre"], "Écris correctement le mot /ʃɑ̃bʁ/ désignant une pièce où l’on dort.", "chambre"),
    example("Quel mot est correctement orthographié ?", "danse", ["dense", "dançe"], "Écris correctement le nom /dɑ̃s/ correspondant au verbe « danser ».", "danse"),
  ],
  orthographier_nasale_on_om: [
    example("Quel mot est correctement orthographié ?", "tomber", ["tonber", "taumber"], "Écris correctement le verbe /tɔ̃be/ qui signifie perdre l’équilibre.", "tomber"),
    example("Quel mot est correctement orthographié ?", "monde", ["momde", "maunde"], "Écris correctement le mot /mɔ̃d/ qui désigne l’ensemble des êtres et des choses.", "monde"),
    example("Quel mot est correctement orthographié ?", "bonbon", ["bombon", "bonbom"], "Écris correctement le mot /bɔ̃bɔ̃/ qui désigne une friandise.", "bonbon"),
  ],
  orthographier_nasale_in_ain_ein: [
    example("Quel mot est correctement orthographié ?", "matin", ["matain", "matein"], "Écris correctement le mot /matɛ̃/ qui désigne le début de la journée.", "matin"),
    example("Quel mot est correctement orthographié ?", "pain", ["pin", "pein"], "Écris correctement le mot /pɛ̃/ désignant l’aliment préparé avec de la farine.", "pain"),
    example("Quel mot est correctement orthographié ?", "peinture", ["pinture", "painture"], "Écris correctement le mot /pɛ̃tyʁ/ correspondant au verbe « peindre ».", "peinture"),
  ],
  appliquer_m_devant_m_b_p: [
    example("Quel mot applique correctement la règle devant p ?", "impossible", ["inpossible", "imposible"], "Écris correctement l’adjectif qui signifie « qui ne peut pas être réalisé ».", "impossible"),
    example("Quel mot applique correctement la règle devant b ?", "tomber", ["tonber", "taunber"], "Écris correctement le verbe /tɔ̃be/ en appliquant la règle devant b.", "tomber"),
    example("Quel mot applique correctement la règle devant m ?", "emmener", ["en mener", "enmener"], "Écris correctement le verbe qui signifie « conduire quelqu’un avec soi ».", "emmener"),
  ],
  choisir_e_accent_aigu_grave: [
    example("Quel mot est correctement accentué ?", "école", ["ècole", "ecole"], "Écris correctement le mot qui désigne un établissement où l’on apprend.", "école"),
    example("Quel mot est correctement accentué ?", "père", ["pére", "pere"], "Écris correctement le nom masculin correspondant à « mère ».", "père"),
    example("Quel mot est correctement accentué ?", "été", ["èté", "etè"], "Écris correctement le nom de la saison la plus chaude.", "été"),
  ],
  employer_accent_circonflexe: [
    example("Quel mot est correctement orthographié ?", "forêt", ["foret", "forét"], "Écris correctement le mot qui désigne une vaste étendue d’arbres.", "forêt"),
    example("Quel mot est correctement orthographié ?", "fête", ["fète", "fete"], "Écris correctement le mot qui désigne une célébration.", "fête"),
    example("Quel mot est correctement orthographié ?", "hôpital", ["hopital", "hôpîtal"], "Écris correctement le mot qui désigne un établissement de soins.", "hôpital"),
  ],
  employer_cedille: [
    example("Quel mot est correctement orthographié ?", "garçon", ["garcon", "garsson"], "Écris correctement le mot qui désigne un enfant de sexe masculin.", "garçon"),
    example("Quel mot est correctement orthographié ?", "leçon", ["lecon", "lesson"], "Écris correctement le mot qui désigne ce qu’un professeur enseigne.", "leçon"),
    example("Quel mot est correctement orthographié ?", "français", ["francais", "franssais"], "Écris correctement l’adjectif correspondant à la France.", "français"),
  ],
  employer_trema: [
    example("Quel mot est correctement orthographié ?", "Noël", ["Noel", "Noèl"], "Écris correctement le nom de la fête célébrée le 25 décembre.", "Noël"),
    example("Quel mot est correctement orthographié ?", "maïs", ["mais", "maîs"], "Écris correctement le nom de la céréale aux grains jaunes.", "maïs"),
    example("Quel mot est correctement orthographié ?", "naïf", ["naif", "naîf"], "Écris correctement l’adjectif qui signifie « trop confiant par simplicité ».", "naïf"),
  ],
  reconnaitre_radical_famille_mots: [
    example("Quel est le radical commun à « chanter, chanson, chanteur » ?", "chant", ["chan", "chante"], "Écris le radical commun à « chanter, chanson, chanteur ».", "chant"),
    example("Quel est le radical commun à « dent, dentiste, dentaire » ?", "dent", ["den", "denti"], "Écris le radical commun à « dent, dentiste, dentaire ».", "dent"),
    example("Quel est le radical commun à « lait, laitage, laitier » ?", "lait", ["lai", "laiti"], "Écris le radical commun à « lait, laitage, laitier ».", "lait"),
  ],
  justifier_lettre_finale_muette: [
    example("Quelle forme permet de justifier le d final de « grand » ?", "grande", ["grandi", "grandeur"], "Écris le masculin de « grande » en conservant la lettre finale muette.", "grand"),
    example("Quelle forme permet de justifier le t final de « petit » ?", "petite", ["petitesse", "petitement"], "Écris le masculin de « petite ».", "petit"),
    example("Quelle forme permet de justifier le g final de « long » ?", "longue", ["longueur", "allonger"], "Écris le masculin de « longue ».", "long"),
  ],
  orthographier_consonne_doublee: [
    example("Quel mot est correctement orthographié ?", "appeler", ["apeler", "appeller"], "Écris correctement le verbe qui signifie « donner un nom ou téléphoner ».", "appeler"),
    example("Quel mot est correctement orthographié ?", "addition", ["adition", "addittion"], "Écris correctement le nom de l’opération qui consiste à ajouter.", "addition"),
    example("Quel mot est correctement orthographié ?", "terre", ["tere", "terrrre"], "Écris correctement le mot qui désigne le sol ou notre planète.", "terre"),
  ],
  orthographier_prefixe_frequent: [
    example("Quel mot avec le préfixe im- est correctement orthographié ?", "impossible", ["inpossible", "im possible"], "Ajoute le préfixe négatif correct à « possible » pour former son contraire.", "impossible"),
    example("Quel mot avec le préfixe re- est correctement orthographié ?", "relire", ["re-lire", "rellire"], "Ajoute le préfixe indiquant la répétition à « lire ».", "relire"),
    example("Quel mot avec le préfixe pré- est correctement orthographié ?", "préhistoire", ["pré-histoire", "prèistoire"], "Forme le mot désignant la période avant l’histoire écrite avec le préfixe pré-.", "préhistoire"),
  ],
  orthographier_suffixe_frequent: [
    example("Quel adverbe est correctement formé à partir de « rapide » ?", "rapidement", ["rapidemant", "rapide ment"], "Forme l’adverbe correspondant à l’adjectif « rapide ».", "rapidement"),
    example("Quel nom de personne est correctement formé à partir de « chanter » ?", "chanteur", ["chantteur", "chanteure"], "Forme le nom d’une personne qui chante.", "chanteur"),
    example("Quel adjectif est correctement formé à partir de « lire » ?", "lisible", ["lirable", "lisibble"], "Forme l’adjectif signifiant « que l’on peut lire ».", "lisible"),
  ],
  orthographier_mot_invariable_frequent: [
    example("Quel mot invariable est correctement orthographié ?", "beaucoup", ["beaucou", "beaucoups"], "Écris correctement l’adverbe qui signifie « en grande quantité ».", "beaucoup"),
    example("Quel mot invariable est correctement orthographié ?", "toujours", ["toujour", "tousjours"], "Écris correctement l’adverbe qui signifie « à tout moment ».", "toujours"),
    example("Quel mot invariable est correctement orthographié ?", "parmi", ["parmis", "par mie"], "Écris correctement la préposition qui signifie « au milieu de plusieurs ».", "parmi"),
  ],
  orthographier_mot_irregulier_frequent: [
    example("Quel mot est correctement orthographié ?", "monsieur", ["messieur", "monssieur"], "Écris correctement le titre de civilité masculin singulier.", "monsieur"),
    example("Quel mot est correctement orthographié ?", "femme", ["fame", "fèmme"], "Écris correctement le nom féminin correspondant à « homme ».", "femme"),
    example("Quel mot est correctement orthographié ?", "accueil", ["acceuil", "acueil"], "Écris correctement le nom correspondant au verbe « accueillir ».", "accueil"),
  ],
};

export const LOCAL_SPELLING_ITEM_PREFIX = "local-spelling-v1";

export async function buildLocalSpellingDraftItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const items: CanonicalDiagnosticBankItem[] = [];

  for (const [nodeKey, examples] of Object.entries(EXAMPLES)) {
    const node = nodeByKey.get(nodeKey);
    if (!node || node.strand !== "orthographe_lexicale") {
      throw new Error(`Local spelling node is absent or incompatible: ${nodeKey}`);
    }
    for (const expectation of ["receptive", "controlled_production"] as const) {
      const evidence = node.evidence.find((candidate) => candidate.expectation === expectation);
      if (!evidence) throw new Error(`Local spelling evidence is absent: ${nodeKey}:${expectation}`);
      for (let index = 0; index < examples.length; index += 1) {
        const tier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
        const sample = examples[index];
        const raw: GeneratedItem = expectation === "receptive"
          ? {
              nodeKey,
              strand: node.strand,
              modality: "grammar_analysis",
              learnerMode: "shared",
              responseType: "mcq",
              promptFr: sample.receptivePrompt,
              acceptableAnswers: [],
              validatorType: "exact",
              choices: [
                { text: sample.correct, correct: true },
                ...sample.distractors.map((text) => ({ text, correct: false })),
              ],
              difficulty: diagnosticDifficultyForTier(tier),
            }
          : {
              nodeKey,
              strand: node.strand,
              modality: "writing",
              learnerMode: "shared",
              responseType: index === 0 ? "short_answer" : index === 1 ? "cloze" : "transform",
              promptFr: sample.productionPrompt,
              instructionsFr: "Écris uniquement la réponse demandée et respecte les accents.",
              correctAnswer: sample.productionAnswer,
              acceptableAnswers: [],
              validatorType: "exact",
              difficulty: diagnosticDifficultyForTier(tier),
            };
        const gated = await runGates(raw, { knownNodeKeys, knownMisconceptionKeys: new Set() });
        if (!gated.item || gated.gates.verdict === "rejected"
          || !gated.gates.gate1_invariants.ok || !gated.gates.gate2_answer_key.ok) {
          throw new Error(`Local spelling item failed hard QC: ${nodeKey}:${expectation}:${tier}`);
        }
        items.push({
          itemKey: [LOCAL_SPELLING_ITEM_PREFIX, nodeKey, expectation, tier].join(":"),
          item: gated.item,
          evidenceKey: evidence.key,
          evidenceExpectation: expectation,
          sectionKey: "spelling",
          promptFamily: diagnosticPromptFamilies("spelling", expectation)[index],
          difficultyTier: tier,
          qcGates: gated.gates,
          reviewStatus: "needs_human_review",
        });
      }
    }
  }

  return items;
}

function example(
  receptivePrompt: string,
  correct: string,
  distractors: readonly [string, string],
  productionPrompt: string,
  productionAnswer: string,
): SpellingExample {
  return { receptivePrompt, correct, distractors, productionPrompt, productionAnswer };
}
