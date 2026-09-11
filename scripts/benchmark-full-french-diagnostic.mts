import {inspectProfileDiscrimination} from "../src/lib/diagnostic/granular/profile-discrimination";
import { readFileSync, writeFileSync } from "node:fs";
import { checksum } from "../src/lib/taxonomy/validate";
import { adaptV3ForAssessment, type EvidenceSkill } from "../src/lib/diagnostic/granular/v3-adapter";
import { applyFacetTargets } from "../src/lib/diagnostic/granular/facet-adapter";
import { buildV3Facets } from "../src/lib/diagnostic/granular/facets";
import { allocateQuestionPools, inspectQuestionPools } from "../src/lib/diagnostic/granular/question-pools";
import { assessWithinOccasion, DEFAULT_POLICY, type Probe } from "../src/lib/diagnostic/granular/engine";
import { bindAssessmentRelease } from "../src/lib/diagnostic/granular/release-binding";
import { createSession, sessionView, transitionSession, type SessionEvent } from "../src/lib/diagnostic/granular/session";

// Routing evidence only. These symbolic probes are never a canonical question bank,
// contain no review approvals, and cannot be imported as learner content.
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json");
const bank = read("generated/diagnostic-bank-v3-draft.json");
const facets = buildV3Facets(artifact.taxonomy);
const source = applyFacetTargets(adaptV3ForAssessment({ artifact, bank }), facets, bank).assessment;
source.probes = source.skills.flatMap(skill => skill.modes.flatMap(mode => {
  const rule = skill.evidenceRequirements?.[mode];
  const count = Math.max(16, 2 * ((rule?.minimumItems ?? 3) + 2));
  return Array.from({ length: count }, (_, index): Probe => {
    const id = `ROUTING-ONLY:${skill.id}:${index.toString().padStart(3, "0")}`;
    const materialKeys = ["word", "sentence"].map(kind => `${kind}:${checksum({ id, kind })}`);
    const genre = facets.find(facet => facet.key === skill.facetKey && facet.dimension === "text_type")?.value;
    return {
      id, skillId: skill.id, mode, contextId: `symbolic-context:${id}`,
      difficulty: [.25, .5, .75][index % 3], expectedSeconds: skill.domain === "reading_comprehension" ? 60 : 30,
      guessProbability: mode === "recognition" || mode === "interpretation" ? .25 : .05,
      materialKeys, assessedMaterialKeys: materialKeys,
      textualSupportAssessed: true,
      textType: genre === "literary" ? "narrative" : genre ?? ["narrative", "informational", "argumentative"][index % 3],
      evidenceFeatures: rule?.featureRequirements?.map(feature => feature.feature),
      contrastingErrorKeys: Array.from({ length: rule?.minimumContrastingErrors ?? 0 }, (_, i) => `symbolic-error:${i}`),
      negativeExampleAssessed: true,
    };
  });
}));
source.bankChecksum = checksum({ scope: "nonpublishable-symbolic-routing", probes: source.probes });
const allocation = allocateQuestionPools(source);
if (!allocation.ready || !inspectQuestionPools(allocation.assessment).ok) throw Error("Synthetic routing pool allocation failed");
const assessment = allocation.assessment;
const release = bindAssessmentRelease(assessment, { taxonomyId: "routing-only-french-v3", bankId: "routing-only-symbolic" });
const byId = new Map(assessment.skills.map(skill => [skill.id, skill]));
const byProbe = new Map(assessment.probes.map(probe => [probe.id, probe]));
type Profile = { id: string; description: string; knows: (skill: EvidenceSkill) => boolean; guessing?: boolean; skips?: boolean; historyComplete?: boolean };
const profiles: Profile[] = [
  { id: "all_correct", description: "Every sampled initial skill answered correctly", knows: () => true },
  { id: "all_incorrect", description: "Every sampled initial skill answered incorrectly", knows: () => false },
  { id: "regular_vs_irregular", description: "Regular verb patterns known; individual irregular verbs weak; other skills known", knows: s => s.domain !== "conjugation" || !s.branch.startsWith("conjugation:verb:") },
  { id: "verb_specific_tense_frontiers", description: "Aller/venir and regular patterns strong; prendre/dire present only; other irregulars through imparfait", knows: s => s.domain !== "conjugation" || !s.branch.startsWith("conjugation:verb:") || /:(aller|venir)$/.test(s.branch) || (/:(prendre|dire)$/.test(s.branch) ? s.nodeKey.includes("present_indicatif") : /present_indicatif|imparfait/.test(s.nodeKey)) },
  { id: "literal_vs_inference", description: "Explicit reading information known; inference and argument evaluation weak", knows: s => s.domain !== "reading_comprehension" || !/inferer|argument|preuve|point_de_vue/.test(s.nodeKey) },
  { id: "reading_reference_gap", description: "Pronoun and demonstrative resolution weak despite otherwise strong reading", knows: s => s.domain !== "reading_comprehension" || !/resoudre_pronom|resoudre_demonstratif|chaine/.test(s.nodeKey) },
  { id: "cod_vs_coi", description: "Direct-object pronouns known; indirect-object, y/en and double-pronoun use weak", knows: s => !/pronom_coi|pronoms_y_en|doubles_pronoms|cod_coi/.test(s.nodeKey) },
  { id: "lexical_vs_agreement", description: "Lexical spelling strong; grammatical spelling weak", knows: s => s.samplingGroup !== "orthographe_grammaticale" },
  { id: "agreement_vs_lexical", description: "Grammatical spelling strong; lexical spelling weak", knows: s => s.samplingGroup !== "orthographe_lexicale" },
  { id: "recognition_vs_production", description: "Recognition known; producing forms and interpreting texts weak", knows: s => s.modes[0] === "recognition" },
  { id: "guessing_only", description: "Unknown skills; seeded random answers at each symbolic probe's chance rate", knows: () => false, guessing: true },
  { id: "intermittent_skips", description: "Known skills with every fourth question skipped", knows: () => true, skips: true },
  { id: "incomplete_material_history", description: "Correct answers with no proof of complete prior material capture", knows: () => true, historyComplete: false },
];
function run(profile: Profile, seed: number) {
  let state = createSession(release), at = Date.parse("2026-09-11T09:00:00Z"), randomState = seed;
  const random = () => ((randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0) / 2 ** 32);
  const apply = (event: SessionEvent) => { state = transitionSession({ state, release, expectedRevision: state.revision, event, skills: assessment.skills, bank: assessment.probes }); };
  apply({ type: "resume", at });
  let presented = 0;
  while (state.phase === "assessing") {
    const probe = byProbe.get(state.pendingItemId!);
    if (!probe || ++presented > 100) throw Error("Missing question or unbounded diagnostic");
    if (presented === 9) {
      apply({ type: "pause", at });
      const seconds = state.activeSeconds;
      at += 3 * 60 * 60 * 1000;
      apply({ type: "resume", at });
      if (state.activeSeconds !== seconds) throw Error("Paused time was charged");
    }
    for (let seconds = probe.expectedSeconds; seconds > 30; seconds -= 30) {
      at += 30_000; apply({ type: "pulse", at });
    }
    at += 30_000;
    if (profile.skips && presented % 4 === 0) apply({ type: "skip", at, itemId: probe.id });
    else apply({ type: "answer", at, itemId: probe.id, correct: profile.guessing ? random() < probe.guessProbability : profile.knows(byId.get(probe.skillId)!), materialReceipt: {
      presentationId: `symbolic-presentation:${probe.id}`, sourceChecksum: checksum(probe), historyComplete: profile.historyComplete !== false,
      firstRecordedKeys: probe.materialKeys!, previouslySeenKeys: [], assessedMaterialKeys: probe.assessedMaterialKeys,
    } });
  }
  const view = sessionView(state, assessment.skills);
  const today = new Map(assessWithinOccasion(assessment.skills, state.observations).map(result => [result.skillId, result]));
  const answered = state.observations.filter(observation => !observation.skipped);
  const sampled = [...new Set(state.observations.map(observation => observation.skillId))].map(id => {
    const skill = byId.get(id)!, result = view.results.find(result => result.skillId === id)!;
    const observations = answered.filter(observation => observation.skillId === id);
    return { skillId: id, labelFr: skill.labelFr, strand: skill.samplingGroup, level: skill.level, challengeOrder: skill.challengeOrder,
      expectedKnown: profile.knows(skill), answered: observations.length, correct: observations.filter(o => o.correct).length,
      status: result.status, withinOccasionResolved: today.get(id)!.resolved,
      probability: result.modes[0].probability, countedEvidence: result.modes[0].distinctItems,
      minimumItems: skill.evidenceRequirements?.[skill.modes[0]]?.minimumItems ?? DEFAULT_POLICY.minimumItemsPerMode };
  });
  const violations: string[] = [];
  // Check family coverage against the facet catalogue, independently of the
  // selector's branch-name routing implementation.
  const conjugationFamilies = ["general", "pattern", "verb"].map(family => {
    const targets = sampled.filter(s => {
      if (s.strand !== "conjugaison") return false;
      const dimension = facets.find(facet => facet.key === byId.get(s.skillId)!.facetKey)?.dimension;
      return (dimension === "verb" || dimension === "pattern" ? dimension : "general") === family;
    });
    return { family, answered: targets.reduce((sum, s) => sum + s.answered, 0),
      knownTargetsWithEvidenceToday: targets.filter(s => s.expectedKnown && s.withinOccasionResolved).map(s => s.skillId),
      weakTargetsWithEvidenceToday: targets.filter(s => !s.expectedKnown && s.withinOccasionResolved).map(s => s.skillId) };
  });
  if (conjugationFamilies.some(family => !family.answered)) violations.push("missing_conjugation_family");
  if (profile.id === "regular_vs_irregular" && (
    !conjugationFamilies.find(family => family.family === "pattern")!.knownTargetsWithEvidenceToday.length ||
    !conjugationFamilies.find(family => family.family === "verb")!.weakTargetsWithEvidenceToday.length
  )) violations.push("regular_irregular_contrast_not_established");
  if (state.activeSeconds > DEFAULT_POLICY.activeSeconds) violations.push("active_time_exceeded");
  if (state.completionReason !== "time_budget") violations.push(`unexpected_ending:${state.completionReason}`);
  if (new Set(state.observations.map(o => o.itemId)).size !== state.observations.length) violations.push("repeated_item");
  if (state.observations.some(o => byProbe.get(o.itemId)?.usage !== "initial")) violations.push("reserved_check_used");
  if (new Set(sampled.map(s => s.strand)).size !== 5) violations.push("missing_strand");
  if (view.results.some(result => !answered.some(o => o.skillId === result.skillId) && result.status !== "unknown")) violations.push("untested_skill_classified");
  if (!profile.guessing && sampled.some(s => s.countedEvidence > 0 && (s.expectedKnown ? s.probability <= .5 : s.probability >= .5))) violations.push("evidence_direction_wrong");
  if (profile.historyComplete === false && sampled.some(s => {
    const skill = byId.get(s.skillId)!, rule = skill.evidenceRequirements?.[skill.modes[0]];
    return (rule?.novelWordsRequired || rule?.novelSentencesRequired) && s.countedEvidence > 0;
  })) violations.push("unverified_novelty_counted");
  return { profile: profile.id, seed, description: profile.description, completionReason: state.completionReason,
    activeSeconds: state.activeSeconds, questionsPresented: state.observations.length, questionsAnswered: answered.length,
    sampledTargets: sampled.length, unsampledTargets: assessment.skills.length - sampled.length,
    targetsReachingMinimumItemCount: sampled.filter(s => s.countedEvidence >= s.minimumItems).length,
    targetsWithSufficientEvidenceToday: sampled.filter(s => s.withinOccasionResolved).length,
    confirmedMastered: view.results.filter(r => r.status === "mastered").length,
    confirmedMissing: view.results.filter(r => r.status === "missing").length,
    provisional: view.provisional, conjugationFamilies,
    strands: [...new Set(assessment.skills.map(s => s.samplingGroup))].map(strand => {
      const targets = sampled.filter(s => s.strand === strand);
      return { strand, sampledTargets: targets.length, answered: targets.reduce((sum, s) => sum + s.answered, 0),
        targetsReachingMinimumItemCount: targets.filter(s => s.countedEvidence >= s.minimumItems).length,
        targetsWithSufficientEvidenceToday: targets.filter(s => s.withinOccasionResolved).length,
        sampledKnown: targets.filter(s => s.expectedKnown).length, sampledWeak: targets.filter(s => !s.expectedKnown).length };
    }), sampled, violations };
}
const runs = profiles.flatMap(profile => (profile.guessing ? [1, 7, 42, 101] : [1]).map(seed => run(profile, seed)));
// A necessary lower bound, not sufficient proof of assessment quality: even the
// deterministic extremes should gather sufficient within-occasion evidence for
// one target in every strand. Official multiple-occasion criteria are unchanged.
const depthChecks = runs.filter(run => run.profile === "all_correct" || run.profile === "all_incorrect")
  .flatMap(run => run.strands.map(strand => ({ profile: run.profile, strand: strand.strand,
    passed: strand.targetsWithSufficientEvidenceToday > 0 })));
const contrastScopes:Record<string,(skill:EvidenceSkill)=>boolean>={
 regular_vs_irregular:s=>s.domain==="conjugation"&&(s.branch.startsWith("conjugation:pattern:")||s.branch.startsWith("conjugation:verb:")),
 verb_specific_tense_frontiers:s=>s.domain==="conjugation"&&s.branch.startsWith("conjugation:verb:"),
 literal_vs_inference:s=>s.domain==="reading_comprehension",
 reading_reference_gap:s=>s.domain==="reading_comprehension",
 cod_vs_coi:s=>/pronom/.test(s.nodeKey),
 lexical_vs_agreement:s=>s.domain==="spelling",
 agreement_vs_lexical:s=>s.domain==="spelling",
 recognition_vs_production:s=>s.domain==="conjugation",
};
const discriminationChecks=runs.filter(run=>contrastScopes[run.profile]).map(run=>{
 const profile=profiles.find(profile=>profile.id===run.profile)!;
 const targets=assessment.skills.filter(skill=>skill.assessmentStage!=="learning"&&contrastScopes[run.profile](skill))
  .map(skill=>({skillId:skill.id,branch:skill.branch,expectedKnown:profile.knows(skill)}));
 return {profile:run.profile,seed:run.seed,...inspectProfileDiscrimination(targets,run.sampled,run.profile==="verb_specific_tense_frontiers")};
});
const report = {
  scope: "Full refined French graph routing regression; not content approval, psychometric calibration or authenticated integration",
  taxonomyChecksum: assessment.taxonomyChecksum, proposedFacetChecksum: assessment.facetChecksum,
  targets: assessment.skills.length, initialTargets: assessment.skills.filter(s => s.assessmentStage === "initial").length,
  symbolicProbes: assessment.probes.length, budgetSeconds: DEFAULT_POLICY.activeSeconds,
  releaseReadiness: "not_established",
  findings: [
    "Runtime invariants alone do not establish sufficient diagnostic depth. Inspect item counts per target and strand below.",
    "Branch visits now allow up to six questions before rotation within a strand; the breadth/depth tradeoff still needs educator and student calibration.",
    "Conjugation time is balanced between general concepts, regular/spelling patterns and individual verbs using the compiled facet branch identities.",
    "Refined verb-form targets use a separately versioned draft challenge order, starting with the present; the approved prerequisite depth remains unchanged.",
    "Tense recognition and interpretation use the draft ranks too; other general concepts retain graph depth. Challenge ranks and entry-point selection require educator/student validation before release.",
    "A profile distinction that was not sampled is not evidence that the system can distinguish that profile.",
  ],
  assumptions: [
    "Synthetic truth is defined per exact target; it does not enforce prerequisite mastery or assign a global student level.",
    "Question duration is fixed at 30 seconds, or 60 seconds for short-passage reading; these are uncalibrated estimates.",
    "Symbolic material identities, feature coverage and textual support are assumed valid; this does not prove authorable or reviewed content.",
    "In particular, unique symbolic homophone tokens do not resolve the real fixed-pair novelty conflict.",
    "Complete prior material history is assumed only inside this test, except for the explicit incomplete-history case.",
    "Same-day evidence cannot satisfy multiple assessment occasions. Independent writing remains deferred to learning.",
  ], depthChecks, discriminationChecks, runs,
};
const path = "docs/diagnostic/full-french-routing-report.json", serialized = JSON.stringify(report, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== serialized) throw Error("Full French routing report is stale");
} else writeFileSync(path, serialized);
console.log(JSON.stringify({ depthChecks, discriminationChecks, runs: runs.map(run => ({ ...run, sampled: undefined })) }, null, 2));
if (runs.some(run => run.violations.length) || (process.argv.includes("--require-depth") && depthChecks.some(check => !check.passed)) || (process.argv.includes("--require-discrimination") && discriminationChecks.some(check=>!check.passed))) process.exitCode = 1;
