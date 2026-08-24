import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type { CanonicalDiagnosticBankItem, DiagnosticEvidenceExpectation } from "./item-bank";

type GapExample = {
  prompt: string;
  answer: string;
  distractors?: readonly [string, string];
};
type GapPlan = {
  nodeKey: string;
  expectation: Exclude<DiagnosticEvidenceExpectation, "independent_production">;
  examples: readonly [GapExample, GapExample, GapExample];
};

const PLANS: readonly GapPlan[] = [
  production("construction_accord_determinant_nom", [
    ["Corrige : « une jardin fleuri ».", "un jardin fleuri"],
    ["Corrige : « ces voiture rapides ».", "ces voitures rapides"],
    ["Corrige : « plusieurs idée intéressantes ».", "plusieurs idées intéressantes"],
  ]),
  production("construction_accord_nom_adjectif", [
    ["Corrige l’accord : « une veste bleu ».", "une veste bleue"],
    ["Corrige l’accord : « des chemins étroite ».", "des chemins étroits"],
    ["Corrige l’accord : « les anciennes maisons blanc ».", "les anciennes maisons blanches"],
  ]),
  production("construction_accord_sujet_verbe", [
    ["Corrige : « Les enfants joue dehors. »", "Les enfants jouent dehors."],
    ["Corrige : « La liste des invités sont prête. »", "La liste des invités est prête."],
    ["Corrige : « Ni Paul ni Mina ne vient demain. »", "Ni Paul ni Mina ne viennent demain."],
  ]),
  production("construction_accord_participe", [
    ["Corrige : « Elle est arrivé tôt. »", "Elle est arrivée tôt."],
    ["Corrige : « Les lettres sont envoyé. »", "Les lettres sont envoyées."],
    ["Corrige : « Les chansons qu’il a composé sont connues. »", "Les chansons qu’il a composées sont connues."],
  ]),
  receptive("maintenir_orthographe_lexicale_phrase", [
    ["Quelle phrase ne contient aucune erreur lexicale ?", "Le bateau avance malgré la tempête.", ["Le batau avance malgré la tempète.", "Le bateau avanße malgré la tempête."]],
    ["Quelle phrase conserve l’orthographe correcte de tous les mots ?", "Nous accueillons toujours les nouveaux élèves.", ["Nous acceuillons toujour les nouveaux élèves.", "Nous accueillons toujour les nouveaus élèves."]],
    ["Quelle phrase est lexicalement correcte ?", "La forêt entoure silencieusement le village.", ["La foret entoure silencieuzement le village.", "La forêt entoure silensieusement le vilage."]],
  ]),
  production("maintenir_orthographe_lexicale_phrase", [
    ["Corrige les erreurs lexicales : « Le batau avance sur l’o. »", "Le bateau avance sur l’eau."],
    ["Corrige les erreurs lexicales : « Nous acceuillons toujour nos voisins. »", "Nous accueillons toujours nos voisins."],
    ["Corrige les erreurs lexicales : « La foret entoure silensieusement le vilage. »", "La forêt entoure silencieusement le village."],
  ]),
  receptive("reviser_orthographe_lexicale_paragraphe", [
    ["Quel paragraphe est lexicalement correct ?", "Le bateau quitte le port. Au loin, la forêt borde la côte.", ["Le batau quitte le por. Au loin, la foret borde la côte.", "Le bateau quite le port. Au loing, la forêt borde la côte."]],
    ["Quel paragraphe ne contient aucune erreur de mot ?", "L’accueil commence à neuf heures. Chaque visiteur reçoit un programme.", ["L’acceuil commence à neuf heures. Chaque visiteur reçoit un programe.", "L’accueil comence à neuf heures. Chaque visiteur recoit un programme."]],
    ["Quel paragraphe respecte l’orthographe lexicale ?", "La chercheuse observe attentivement les résultats. Elle note plusieurs différences.", ["La chercheuse observe atentivement les résultats. Elle note plusieur différences.", "La chercheuze observe attentivement les résultat. Elle note plusieurs diférences."]],
  ]),
  production("reviser_orthographe_lexicale_paragraphe", [
    ["Corrige : « Le batau quite le por. La foret apparaît au loing. »", "Le bateau quitte le port. La forêt apparaît au loin."],
    ["Corrige : « L’acceuil comence à neuf heures. Chaque visiteur reçoit un programe. »", "L’accueil commence à neuf heures. Chaque visiteur reçoit un programme."],
    ["Corrige : « La chercheuze observe atentivement les résultat. Elle note plusieur diférences. »", "La chercheuse observe attentivement les résultats. Elle note plusieurs différences."],
  ]),
  receptive("former_pluriel_noms_al_aux", [
    ["Quel pluriel de « animal » est correct ?", "animaux", ["animals", "animales"]],
    ["Quel pluriel de « journal » est correct ?", "journaux", ["journals", "journales"]],
    ["Quel pluriel de « festival » est correct ?", "festivals", ["festivaux", "festivales"]],
  ]),
  production("former_pluriel_noms_al_aux", [
    ["Écris « cheval » au pluriel.", "chevaux"],
    ["Écris « travail » au pluriel.", "travaux"],
    ["Écris « récital » au pluriel.", "récitals"],
  ]),
  receptive("former_pluriel_noms_au_eu", [
    ["Quel pluriel de « bateau » est correct ?", "bateaux", ["bateaus", "bateau"]],
    ["Quel pluriel de « feu » est correct ?", "feux", ["feus", "feuz"]],
    ["Quel pluriel de « pneu » est correct ?", "pneus", ["pneux", "pneuz"]],
  ]),
  production("former_pluriel_noms_au_eu", [
    ["Écris « tuyau » au pluriel.", "tuyaux"],
    ["Écris « jeu » au pluriel.", "jeux"],
    ["Écris « bleu » employé comme nom au pluriel.", "bleus"],
  ]),
  receptive("accorder_determinant_nom_ecrit", [
    ["Quel groupe nominal est correctement accordé ?", "ces grandes maisons", ["ce grandes maisons", "ces grande maison"]],
    ["Quel groupe nominal est correctement accordé ?", "plusieurs idées utiles", ["plusieur idées utiles", "plusieurs idée utile"]],
    ["Quel groupe nominal est correctement accordé ?", "toute cette longue histoire", ["tous cette longue histoire", "toute ces long histoire"]],
  ]),
  receptive("accorder_adjectif_nom_ecrit", [
    ["Quel groupe nominal est correctement accordé ?", "une chemise blanche", ["une chemise blanc", "un chemise blanche"]],
    ["Quel groupe nominal est correctement accordé ?", "des sentiers étroits", ["des sentiers étroites", "des sentier étroits"]],
    ["Quel groupe nominal est correctement accordé ?", "de nouvelles solutions efficaces", ["de nouveaux solutions efficace", "de nouvelle solutions efficaces"]],
  ]),
  receptive("accorder_sujet_verbe_ecrit", [
    ["Quelle phrase accorde correctement le verbe avec son sujet ?", "Les élèves travaillent.", ["Les élèves travaille.", "Les élève travaillent."]],
    ["Quelle phrase est correctement accordée ?", "La boîte de crayons est ouverte.", ["La boîte de crayons sont ouverte.", "La boîte de crayons est ouverts."]],
    ["Quelle phrase est correctement accordée ?", "Ni le vent ni la pluie ne ralentissent les coureurs.", ["Ni le vent ni la pluie ne ralentit les coureurs.", "Ni le vent ni la pluie ne ralentisses les coureurs."]],
  ]),
  receptive("reviser_orthographe_grammaticale_paragraphe", [
    ["Quel paragraphe respecte tous les accords ?", "Les jeunes arbres grandissent. Leurs branches deviennent solides.", ["Les jeune arbres grandit. Leurs branche deviennent solide.", "Les jeunes arbre grandissent. Leur branches devient solides."]],
    ["Quel paragraphe est grammaticalement orthographié ?", "Cette équipe prépare ses outils. Elle les range ensuite.", ["Cet équipe prépare ces outils. Elles les range ensuite.", "Cette équipe préparent ses outil. Elle les ranges ensuite."]],
    ["Quel paragraphe respecte les accords complexes ?", "Les données que nous avons recueillies sont précises. Elles confirment notre hypothèse.", ["Les données que nous avons recueilli sont précis. Elle confirme notre hypothèse.", "Les donnée que nous avons recueillies est précises. Elles confirme notre hypothèse."]],
  ]),
  production("reviser_orthographe_grammaticale_paragraphe", [
    ["Corrige : « Les jeune arbres grandit. Leurs branche deviennent solide. »", "Les jeunes arbres grandissent. Leurs branches deviennent solides."],
    ["Corrige : « Cet équipe préparent ces outils. Elles les range ensuite. »", "Cette équipe prépare ses outils. Elle les range ensuite."],
    ["Corrige : « Les donnée que nous avons recueilli est précis. Elle confirme nos hypothèse. »", "Les données que nous avons recueillies sont précises. Elles confirment nos hypothèses."],
  ]),
] as const;

export const LOCAL_SPELLING_GAP_ITEM_PREFIX = "local-spelling-gap-v1";

export async function buildLocalSpellingGapDraftItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const items: CanonicalDiagnosticBankItem[] = [];
  for (const plan of PLANS) {
    const node = nodeByKey.get(plan.nodeKey);
    if (!node || !["orthographe_lexicale", "orthographe_grammaticale"].includes(node.strand)) {
      throw new Error(`Spelling gap node is absent or incompatible: ${plan.nodeKey}`);
    }
    const evidence = node.evidence.find((candidate) => candidate.expectation === plan.expectation);
    if (!evidence) throw new Error(`Spelling gap evidence is absent: ${plan.nodeKey}:${plan.expectation}`);
    for (let index = 0; index < plan.examples.length; index += 1) {
      const sample = plan.examples[index];
      const tier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
      const raw: GeneratedItem = plan.expectation === "receptive"
        ? {
            nodeKey: node.key, strand: node.strand, modality: "grammar_analysis",
            learnerMode: "shared", responseType: "mcq",
            promptFr: sample.prompt,
            acceptableAnswers: [], validatorType: "exact",
            choices: [
              { text: sample.answer, correct: true },
              ...(sample.distractors ?? []).map((text) => ({ text, correct: false })),
            ], difficulty: diagnosticDifficultyForTier(tier),
          }
        : {
            nodeKey: node.key, strand: node.strand, modality: "writing",
            learnerMode: "shared",
            responseType: index === 0 ? "short_answer" : index === 1 ? "cloze" : "transform",
            promptFr: sample.prompt, instructionsFr: "Écris uniquement la réponse corrigée.",
            correctAnswer: sample.answer, acceptableAnswers: [], validatorType: "exact",
            difficulty: diagnosticDifficultyForTier(tier),
          };
      const gated = await runGates(raw, { knownNodeKeys, knownMisconceptionKeys: new Set() });
      if (!gated.item || gated.gates.verdict === "rejected"
        || !gated.gates.gate1_invariants.ok || !gated.gates.gate2_answer_key.ok) {
        throw new Error(`Spelling gap item failed hard QC: ${plan.nodeKey}:${plan.expectation}:${tier}`);
      }
      items.push({
        itemKey: [LOCAL_SPELLING_GAP_ITEM_PREFIX, plan.nodeKey, plan.expectation, tier].join(":"),
        item: gated.item, evidenceKey: evidence.key, evidenceExpectation: plan.expectation,
        sectionKey: "spelling", promptFamily: diagnosticPromptFamilies("spelling", plan.expectation)[index],
        difficultyTier: tier, qcGates: gated.gates, reviewStatus: "needs_human_review",
      });
    }
  }
  return items;
}

function receptive(
  nodeKey: string,
  rows: readonly [readonly [string, string, readonly [string, string]], readonly [string, string, readonly [string, string]], readonly [string, string, readonly [string, string]]],
): GapPlan {
  return { nodeKey, expectation: "receptive", examples: rows.map(([prompt, answer, distractors]) => ({ prompt, answer, distractors })) as unknown as GapPlan["examples"] };
}

function production(
  nodeKey: string,
  rows: readonly [readonly [string, string], readonly [string, string], readonly [string, string]],
): GapPlan {
  return { nodeKey, expectation: "controlled_production", examples: rows.map(([prompt, answer]) => ({ prompt, answer })) as unknown as GapPlan["examples"] };
}
