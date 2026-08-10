import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type { CanonicalDiagnosticBankItem, DiagnosticEvidenceExpectation } from "./item-bank";

type Example = { prompt: string; answer: string; distractors?: readonly [string, string] };
type Plan = {
  nodeKey: string;
  expectation: Exclude<DiagnosticEvidenceExpectation, "independent_production">;
  examples: readonly [Example, Example, Example];
};

const PLANS: readonly Plan[] = [
  receptive("distinguer_personne_nombre", [
    ["Quels traits personne-nombre porte « parlons » ?", "1re personne du pluriel", ["2e personne du pluriel", "3e personne du pluriel"]],
    ["Quels traits personne-nombre porte « finissez » ?", "2e personne du pluriel", ["1re personne du pluriel", "2e personne du singulier"]],
    ["Quels traits personne-nombre porte « viennent » ?", "3e personne du pluriel", ["3e personne du singulier", "1re personne du pluriel"]],
  ]),
  receptive("interpreter_marqueur_temporel", [
    ["Quel repère temporel situe normalement l’action dans le passé ?", "hier", ["demain", "en ce moment"]],
    ["Quel repère temporel situe l’action au moment où l’on parle ?", "en ce moment", ["autrefois", "la semaine prochaine"]],
    ["Quel repère temporel annonce une action future ?", "dans trois jours", ["il y a trois jours", "jadis"]],
  ]),
  receptive("interpreter_usages_present", [
    ["Dans « Chaque matin, Lina court », quelle valeur a le présent ?", "habitude", ["événement futur", "action passée achevée"]],
    ["Dans « Je ferme la porte maintenant », quelle valeur a le présent ?", "action en cours", ["vérité générale", "récit passé"]],
    ["Dans « L’eau bout à 100 °C », quelle valeur a le présent ?", "vérité générale", ["ordre", "souvenir"]],
  ]),
  receptive("reconnaitre_futur_proche", [
    ["Quelle forme est au futur proche ?", "nous allons partir", ["nous partirons", "nous partions"]],
    ["Quelle phrase contient un futur proche ?", "Il va pleuvoir.", ["Il pleuvra.", "Il pleuvait."]],
    ["Quelle forme est construite avec aller au présent et un infinitif ?", "elles vont commencer", ["elles commenceront", "elles viennent de commencer"]],
  ]),
  receptive("interpreter_futur_proche", [
    ["Dans « Le train va partir », que signale le futur proche ?", "un départ imminent", ["un départ ancien", "une habitude"]],
    ["Dans « Je vais apprendre le japonais », quelle valeur domine ?", "une intention", ["un souvenir", "une vérité générale"]],
    ["Dans « Nous allons déménager cet été », que présente la forme verbale ?", "un projet déjà envisagé", ["une action achevée", "un ordre passé"]],
  ]),
  receptive("reconnaitre_passe_recent", [
    ["Quelle forme est au passé récent ?", "elle vient de sortir", ["elle est sortie", "elle va sortir"]],
    ["Quelle phrase contient venir de suivi d’un infinitif ?", "Nous venons de terminer.", ["Nous allons terminer.", "Nous terminerons."]],
    ["Quelle forme exprime une action qui s’est produite juste avant ?", "ils viennent d’arriver", ["ils arrivaient", "ils vont arriver"]],
  ]),
  production("produire_passe_recent", [
    ["Conjugue « finir » au passé récent avec « tu ». Écris seulement le groupe verbal.", "viens de finir"],
    ["Conjugue « partir » au passé récent avec « nous ». Écris seulement le groupe verbal.", "venons de partir"],
    ["Conjugue « arriver » au passé récent avec « elles ». Écris seulement le groupe verbal.", "viennent d’arriver"],
  ]),
  receptive("interpreter_passe_recent", [
    ["« Elle vient de téléphoner » signifie que l’appel…", "a eu lieu il y a très peu de temps", ["aura lieu bientôt", "avait lieu régulièrement"]],
    ["Dans « Nous venons de finir », quelle relation temporelle est exprimée ?", "l’action est immédiatement antérieure au présent", ["l’action est future", "l’action est habituelle"]],
    ["Pourquoi employer « ils viennent de partir » ?", "pour insister sur le caractère tout récent du départ", ["pour annoncer un départ lointain", "pour décrire une habitude"]],
  ]),
  receptive("interpreter_passe_compose", [
    ["Dans « Lina a fermé la porte », quelle valeur a le passé composé ?", "action achevée", ["habitude passée", "action future"]],
    ["Dans « Il a plu, donc le sol est mouillé », que relie le passé composé au présent ?", "un événement passé dont le résultat est visible", ["une hypothèse future", "une description habituelle"]],
    ["Dans « Il est entré, a salué puis s’est assis », que marque le passé composé ?", "une succession d’actions au premier plan", ["un décor stable", "une vérité générale"]],
  ]),
  receptive("interpreter_imparfait", [
    ["Dans « Chaque été, nous nagions », quelle valeur a l’imparfait ?", "habitude passée", ["action ponctuelle", "ordre"]],
    ["Dans « Le ciel était gris et le vent soufflait », quelle valeur domine ?", "description de l’arrière-plan", ["suite d’actions achevées", "projet futur"]],
    ["Dans « Je lisais quand tu as appelé », que marque « lisais » ?", "une action en cours interrompue", ["une action postérieure", "une vérité générale"]],
  ]),
  receptive("reconnaitre_passe_simple", [
    ["Quelle forme est au passé simple ?", "il entra", ["il entrait", "il est entré"]],
    ["Quelle phrase contient un passé simple ?", "Ils furent surpris.", ["Ils étaient surpris.", "Ils ont été surpris."]],
    ["Quelle forme verbale est au passé simple ?", "elle prit", ["elle prenait", "elle a pris"]],
  ]),
  receptive("interpreter_passe_simple", [
    ["Dans un récit, « Il ouvrit la porte » présente généralement…", "une action ponctuelle au premier plan", ["une habitude", "une description durable"]],
    ["Pourquoi employer « Ils partirent à l’aube » dans un récit littéraire ?", "pour faire avancer l’action", ["pour décrire un décor", "pour exprimer un projet"]],
    ["Dans « Elle vit la lumière et courut », quel rôle joue le passé simple ?", "il enchaîne des événements narratifs", ["il installe une habitude", "il formule une condition"]],
  ]),
  receptive("reconnaitre_futur_simple", [
    ["Quelle forme est au futur simple ?", "elle parlera", ["elle va parler", "elle parlait"]],
    ["Quelle phrase contient un futur simple ?", "Nous finirons demain.", ["Nous finissons maintenant.", "Nous venons de finir."]],
    ["Quelle forme verbale est au futur simple ?", "ils viendront", ["ils viennent", "ils viendraient"]],
  ]),
  receptive("interpreter_futur_simple", [
    ["Dans « Demain, nous partirons tôt », quelle valeur a le futur ?", "prévision ou projet futur", ["souvenir", "habitude passée"]],
    ["Dans « Tu rangeras ta chambre », quelle valeur peut prendre le futur ?", "ordre atténué", ["action achevée", "description"]],
    ["Dans « Un jour, les villes utiliseront moins d’énergie », que présente le futur ?", "une anticipation", ["un fait passé", "une concession"]],
  ]),
  receptive("interpreter_anteriorite_passee", [
    ["Dans « Il avait mangé avant de partir », quelle action est la plus ancienne ?", "il avait mangé", ["il est parti", "les deux sont simultanées"]],
    ["Dans « Quand nous sommes arrivés, le film avait commencé », que marque le plus-que-parfait ?", "l’action antérieure à notre arrivée", ["l’action postérieure", "une action future"]],
    ["Dans « Elle retrouva le livre qu’elle avait perdu », quelle relation exprime « avait perdu » ?", "une antériorité par rapport à « retrouva »", ["une conséquence future", "une simultanéité"]],
  ]),
  receptive("reconnaitre_conditionnel_present", [
    ["Quelle forme est au conditionnel présent ?", "je parlerais", ["je parlerai", "je parlais"]],
    ["Quelle phrase contient un conditionnel présent ?", "Nous voudrions réserver une table.", ["Nous voulons réserver.", "Nous voudrons réserver."]],
    ["Quelle forme verbale est au conditionnel présent ?", "ils seraient", ["ils seront", "ils étaient"]],
  ]),
  receptive("interpreter_conditionnel_present", [
    ["Dans « Je voyagerais si j’avais le temps », quelle valeur a le conditionnel ?", "conséquence soumise à une condition", ["fait certain", "ordre"]],
    ["Dans « Pourriez-vous fermer la porte ? », quelle valeur a le conditionnel ?", "demande polie", ["récit passé", "habitude"]],
    ["Dans « Il a annoncé qu’il viendrait », que marque le conditionnel ?", "le futur vu depuis un moment passé", ["une action antérieure", "une vérité générale"]],
  ]),
  receptive("reconnaitre_subjonctif_present", [
    ["Quelle forme est au subjonctif présent ?", "que tu viennes", ["tu viens", "tu viendras"]],
    ["Quelle phrase contient un subjonctif présent ?", "Il faut qu’il fasse attention.", ["Il fait attention.", "Il fera attention."]],
    ["Quelle forme verbale est au subjonctif présent ?", "que nous soyons", ["nous sommes", "nous serons"]],
  ]),
  receptive("interpreter_declencheur_subjonctif", [
    ["Quelle expression déclenche normalement le subjonctif ?", "il faut que", ["je constate que", "il est certain que"]],
    ["Pourquoi emploie-t-on le subjonctif après « bien que » ?", "l’expression introduit une concession", ["elle affirme une certitude", "elle situe une date"]],
    ["Quelle locution appelle le subjonctif pour exprimer un but ?", "pour que", ["parce que", "après que"]],
  ]),
  receptive("reconnaitre_imperatif", [
    ["Quelle forme est à l’impératif ?", "Ferme la porte !", ["Tu fermes la porte.", "Tu fermeras la porte."]],
    ["Quelle phrase contient un impératif à la 1re personne du pluriel ?", "Allons au marché !", ["Nous allons au marché.", "Nous irons au marché."]],
    ["Quelle forme verbale est à l’impératif ?", "Prenez vos cahiers !", ["Vous prenez vos cahiers.", "Vous prendrez vos cahiers."]],
  ]),
  receptive("interpreter_valeur_imperatif", [
    ["Dans « Sortez immédiatement ! », quelle valeur a l’impératif ?", "ordre", ["hypothèse", "souvenir"]],
    ["Dans « Prenez le temps de relire », quelle valeur domine ?", "conseil", ["regret", "description"]],
    ["Dans « Allons voir cette exposition ! », quelle valeur a l’impératif ?", "invitation", ["interdiction", "fait passé"]],
  ]),
  receptive("distinguer_infinitif_participe", [
    ["Quelle forme complète « Il va ___ » ?", "manger", ["mangé", "mangeait"]],
    ["Quelle forme complète « Il a ___ » ?", "terminé", ["terminer", "terminait"]],
    ["Dans « Après avoir fermé la porte », quelle forme est « fermé » ?", "participe passé", ["infinitif", "impératif"]],
  ]),
  production("employer_forme_non_finie", [
    ["Complète avec l’infinitif : « Nous devons ___ maintenant. » (partir)", "partir"],
    ["Complète avec le participe passé : « Elle a ___ le rapport. » (finir)", "fini"],
    ["Complète avec le gérondif : « Il apprend ___ chaque jour. » (lire)", "en lisant"],
  ]),
] as const;

export const LOCAL_CONJUGATION_GAP_ITEM_PREFIX = "local-conjugation-gap-v1";

export async function buildLocalConjugationGapDraftItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const items: CanonicalDiagnosticBankItem[] = [];
  for (const plan of PLANS) {
    const node = nodeByKey.get(plan.nodeKey);
    if (!node || node.strand !== "conjugaison") throw new Error(`Conjugation gap node is absent: ${plan.nodeKey}`);
    const evidence = node.evidence.find((candidate) => candidate.expectation === plan.expectation);
    if (!evidence) throw new Error(`Conjugation gap evidence is absent: ${plan.nodeKey}:${plan.expectation}`);
    for (let index = 0; index < plan.examples.length; index += 1) {
      const sample = plan.examples[index];
      const tier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
      const raw: GeneratedItem = plan.expectation === "receptive"
        ? {
            nodeKey: node.key, strand: node.strand, modality: "grammar_analysis",
            learnerMode: "shared", responseType: "mcq", promptFr: `Cas ${index + 1} — ${sample.prompt}`,
            acceptableAnswers: [], validatorType: "exact",
            choices: [{ text: sample.answer, correct: true }, ...(sample.distractors ?? []).map((text) => ({ text, correct: false }))],
            difficulty: diagnosticDifficultyForTier(tier),
          }
        : {
            nodeKey: node.key, strand: node.strand, modality: "writing", learnerMode: "shared",
            responseType: index === 0 ? "short_answer" : index === 1 ? "cloze" : "transform",
            promptFr: sample.prompt, instructionsFr: "Écris uniquement la forme ou le groupe verbal demandé.",
            correctAnswer: sample.answer, acceptableAnswers: [], validatorType: "exact",
            difficulty: diagnosticDifficultyForTier(tier),
          };
      const gated = await runGates(raw, { knownNodeKeys, knownMisconceptionKeys: new Set() });
      if (!gated.item || gated.gates.verdict === "rejected"
        || !gated.gates.gate1_invariants.ok || !gated.gates.gate2_answer_key.ok) {
        throw new Error(`Conjugation gap item failed hard QC: ${plan.nodeKey}:${plan.expectation}:${tier}`);
      }
      items.push({
        itemKey: [LOCAL_CONJUGATION_GAP_ITEM_PREFIX, plan.nodeKey, plan.expectation, tier].join(":"),
        item: gated.item, evidenceKey: evidence.key, evidenceExpectation: plan.expectation,
        sectionKey: "conjugation", promptFamily: diagnosticPromptFamilies("conjugation", plan.expectation)[index],
        difficultyTier: tier, qcGates: gated.gates, reviewStatus: "needs_human_review",
      });
    }
  }
  return items;
}

function receptive(
  nodeKey: string,
  rows: readonly [readonly [string, string, readonly [string, string]], readonly [string, string, readonly [string, string]], readonly [string, string, readonly [string, string]]],
): Plan {
  return { nodeKey, expectation: "receptive", examples: rows.map(([prompt, answer, distractors]) => ({ prompt, answer, distractors })) as unknown as Plan["examples"] };
}

function production(
  nodeKey: string,
  rows: readonly [readonly [string, string], readonly [string, string], readonly [string, string]],
): Plan {
  return { nodeKey, expectation: "controlled_production", examples: rows.map(([prompt, answer]) => ({ prompt, answer })) as unknown as Plan["examples"] };
}
