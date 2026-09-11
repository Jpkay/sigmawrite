import type {ConjugationFormFamily} from "./conjugation-form-family";
import {inspectReleaseScope,type ReleaseScope} from "./release-scope";
import {hasVerifiedNovelMaterial,type ObservedMaterialReceipt} from "./material-receipt";
import {categoryExposurePriority} from "./category-exposure";
import {verifiedWritingEvidence,writingSampleIdentity,type WritingEvidence} from "./writing-evidence";
/** Per-skill adaptive assessment. Challenge order guides probes, never mastery inference. */
export type Mode = "recognition" | "production" | "interpretation" | "independent_production";
export type FeatureRequirement={feature:string;minimumItems:number;minimumContexts:number};
export type Skill = {
  id: string;
  branch: string;
  /** Balance major domains before their finer branches. */
  domain?: string;
  /** Balance approved strands inside a broad domain before fine branches. */
  samplingGroup?:string;
  level: number;
  /** Reviewed with the assessment release; probing order, not graph depth or mastery. */
  challengeOrder?: number;
  /** Release-pinned conjugation sampling category, never mastery evidence. */
  formFamily?: ConjugationFormFamily;
  prerequisites: readonly string[];
  modes: readonly Mode[];
  anchor?: boolean;
  evidenceRequirements?: Partial<Record<Mode, {
    minimumItems: number; minimumContexts: number; minimumOccasions: number;
    minimumAccuracy: number; unaidedRequired: boolean;
    minimumEligibleTokens?:number;
    revisionRequired?:boolean;
    featureRequirements?:FeatureRequirement[];
    textualSupportRequired?:boolean;
    minimumTextTypes?:number;
    minimumContrastingErrors?:number;
    negativeExamplesRequired?:boolean;
    novelWordsRequired?:boolean;
    novelSentencesRequired?:boolean;
    parentMinimumTextTypes?:number;
  }>>;
  assessmentStage?: "initial" | "learning";
};
export type Probe = {
  /** Content-derived sampling variety within a skill/mode; never mastery evidence. */
  samplingCategory?:string;
  materialKeys?:string[];
  assessedMaterialKeys?:string[];
  id: string;
  skillId: string;
  mode: Mode;
  contextId: string;
  difficulty: number;
  expectedSeconds: number;
  guessProbability: number;
  evidenceFeatures?:string[];
  textualSupportAssessed?:boolean;
  textType?:string;
  contrastingErrorKeys?:string[];
  negativeExampleAssessed?:boolean;
  usage?:"initial"|"learning";
};
export type Observation = {
  /** An exposed question deliberately left unanswered, never mastery evidence. */
  skipped?:true;
  /** Server-owned: only fresh independent checks may revise earlier learning evidence. */
  source?:"learning";
  writingEvidence?:WritingEvidence;
  materialReceipt?:ObservedMaterialReceipt;
  itemId: string;
  skillId: string;
  mode: Mode;
  contextId: string;
  correct: boolean;
  guessProbability: number;
  activeSeconds: number;
  occasionId?: string;
  unaided?: boolean;
  evidenceFeatures?:string[];
  textualSupportAssessed?:boolean;
  textType?:string;
  contrastingErrorKeys?:string[];
  negativeExampleAssessed?:boolean;
};
export type SkillResult = {
  skillId: string;
  status: "mastered" | "missing" | "fragile" | "uncertain" | "unknown";
  modes: Array<{ mode: Mode; probability: number; distinctItems: number; distinctContexts: number; distinctOccasions: number; accuracy: number; confirmed: boolean; provisionalGap?:boolean; unconfirmedFeatures?:string[]; textTypes?:string[]; contrastingErrorKeys?:string[]; negativeExampleConfirmed?:boolean }>;
  evidence: "direct" | "untested";
  resolved: boolean;
};
export type Policy = {
  activeSeconds: number;
  minimumItemsPerMode: number;
  minimumContextsPerMode: number;
  maxItemsPerSkill: number;
  /** Bounded follow-up within a branch before rotating to another branch. */
  itemsPerBranchVisit?: number;
  startingLevel: number;
};
export const DEFAULT_POLICY: Policy = {
  activeSeconds: 35 * 60, minimumItemsPerMode: 3, minimumContextsPerMode: 2,
  maxItemsPerSkill: 12, startingLevel: 1, itemsPerBranchVisit: 6,
};
export const MAX_CONFIRMATION_GUESS_CHANCE=.01;
export function correctGuessChance(items:readonly {guessProbability:number}[]):number{
 return items.reduce((chance,item)=>chance*Math.max(.01,Math.min(.5,item.guessProbability)),1);
}

function uniqueObservations(observations: readonly Observation[]) {
  const first = new Map<string, Observation>();
  for (const observation of observations) if (!first.has(observation.itemId)) first.set(observation.itemId, observation);
  return [...first.values()];
}

/** No propagation to other nodes: even a mastered dependent leaves an untested prerequisite unknown. */
export function assessSkills(skills: readonly Skill[], observations: readonly Observation[], policy: Policy = DEFAULT_POLICY): SkillResult[] {
  const unique = uniqueObservations(observations);
  return skills.map(skill => {
    const modes = skill.modes.map(mode => {
      const requirement = skill.evidenceRequirements?.[mode];
      const minimumItems = requirement?.minimumItems ?? policy.minimumItemsPerMode;
      const minimumContexts = requirement?.minimumContexts ?? policy.minimumContextsPerMode;
      const writingResponses=new Set<string>();
      // Explicitly assisted work is practice, even for nodes without a mandatory unaided marker.
      const evidence = unique.filter(o => !o.skipped && o.unaided !== false && o.skillId === skill.id && o.mode === mode && (!requirement?.unaidedRequired || o.unaided === true)
        &&(mode!=="independent_production"||verifiedWritingEvidence(o.writingEvidence,skill.id)!==null)
        &&(!requirement?.revisionRequired||(o.writingEvidence?.revisionReviewed===true&&Boolean(o.writingEvidence.firstDraft)))
        &&(!requirement?.textualSupportRequired||o.textualSupportAssessed===true)
        &&(!requirement?.novelWordsRequired||hasVerifiedNovelMaterial(o.materialReceipt,"word"))
        &&(!requirement?.novelSentencesRequired||hasVerifiedNovelMaterial(o.materialReceipt,"sentence")))
        .filter(o=>{
          if(mode!=="independent_production")return true;
          const key=writingSampleIdentity(o.writingEvidence!.responseText);
          if(writingResponses.has(key))return false;
          writingResponses.add(key);return true;
        });
      const summarize=(evidence:readonly Observation[])=>{
      let logOdds = 0;
      for (const observation of evidence) {
        const guess = Math.max(.01, Math.min(.5, observation.guessProbability));
        logOdds += Math.log(observation.correct ? .9 / guess : .1 / (1 - guess));
      }
      const probability = 1 / (1 + Math.exp(-logOdds));
      const distinctContexts = new Set(evidence.map(o => o.contextId)).size;
      // Undated legacy observations may establish one sitting, but cannot add
      // a fictitious second occasion alongside a known dated observation.
      const knownOccasions=evidence.map(o=>o.occasionId).filter((id):id is string=>Boolean(id)&&id!=="initial-diagnostic"&&!id!.startsWith("initial-diagnostic:"));
      const distinctOccasions = knownOccasions.length?new Set(knownOccasions).size:Number(evidence.length>0);
      const textTypes = [...new Set(evidence.map(o=>o.textType).filter((value):value is string=>Boolean(value)))];
      const writing=evidence.map(o=>verifiedWritingEvidence(o.writingEvidence,skill.id)).filter((value):value is WritingEvidence=>value!==null);
      const eligibleTokens=writing.reduce((sum,value)=>sum+value.eligibleTokens,0);
      const accuracy = mode==="independent_production"
        ? (eligibleTokens?writing.reduce((sum,value)=>sum+value.correctTokens,0)/eligibleTokens:0)
        : evidence.length ? evidence.filter(o => o.correct).length / evidence.length : 0;
      const correctStreak: Observation[] = [];
      for (const observation of [...evidence].reverse()) {
        if (!observation.correct) break;
        correctStreak.push(observation);
      }
      const consistentStreak:Observation[]=[];
      for(const observation of [...evidence].reverse()){
        if(observation.correct!==evidence.at(-1)?.correct)break;
        consistentStreak.push(observation);
      }
      const negativeExampleConfirmed=consistentStreak.some(o=>o.negativeExampleAssessed===true);
      const contrastingErrorKeys=[...new Set(consistentStreak.flatMap(o=>o.contrastingErrorKeys??[]))];
      const chanceOfStreak = correctGuessChance(correctStreak);
      const unconfirmedFeatures=(requirement?.featureRequirements??[]).filter(feature=>{
        const relevant=evidence.filter(o=>o.evidenceFeatures?.includes(feature.feature));
        const lastOutcome=evidence.at(-1)?.correct;
        const streak:Observation[]=[];
        for(const observation of [...relevant].reverse()){
          if(observation.correct!==lastOutcome)break;
          streak.push(observation);
        }
        const chance=correctGuessChance(streak);
        return streak.length<feature.minimumItems||new Set(streak.map(o=>o.contextId)).size<feature.minimumContexts||(lastOutcome===true&&chance>MAX_CONFIRMATION_GUESS_CHANCE);
      }).map(feature=>feature.feature);
      const sufficientWithinOccasion = evidence.length >= minimumItems && distinctContexts >= minimumContexts
          && eligibleTokens >= (requirement?.minimumEligibleTokens??0)
          && unconfirmedFeatures.length===0
          && (!requirement?.negativeExamplesRequired||negativeExampleConfirmed)
          && contrastingErrorKeys.length >= (requirement?.minimumContrastingErrors??0)
          && textTypes.length >= (requirement?.minimumTextTypes??0)
          && (!evidence.at(-1)?.correct || accuracy >= (requirement?.minimumAccuracy ?? .8))
          // Conflicting recent answers must be rechecked, even if model odds are high.
          && new Set(evidence.slice(-minimumItems).map(o => o.correct)).size === 1
          && (!evidence.at(-1)?.correct || chanceOfStreak <= MAX_CONFIRMATION_GUESS_CHANCE)
          // Older successes/failures cannot confirm the opposite of the latest
          // consistent evidence merely through accumulated probability.
          && (evidence.at(-1)?.correct ? probability >= .85 : probability <= .2);
      const confirmed=sufficientWithinOccasion&&distinctOccasions >= (requirement?.minimumOccasions ?? 1);
      // Teaching can respond to a consistent gap without certifying the skill.
      // Only the repeated-occasion requirement is deferred; no content, novelty,
      // context, feature or response-quality requirement is removed.
      const provisionalGap=sufficientWithinOccasion&&!confirmed&&distinctOccasions>0&&evidence.at(-1)?.correct===false;
      return { mode, probability, distinctItems:evidence.length,distinctContexts,distinctOccasions,accuracy,unconfirmedFeatures,textTypes,contrastingErrorKeys,negativeExampleConfirmed,confirmed,
        ...(provisionalGap?{provisionalGap:true}:{}) };
      };
      const cumulative=summarize(evidence);
      const latestOutcome=evidence.at(-1)?.correct;
      const lastChange=evidence.findLastIndex(observation=>observation.correct!==latestOutcome);
      if(lastChange<0||evidence.at(-1)?.source!=="learning")return cumulative;
      // A new demonstration may replace an earlier assessment, but must supply
      // all required contexts, occasions, features and eligible evidence itself.
      // Keep the source history intact for audit and material-exposure checks.
      const learningStart=evidence.findLastIndex(observation=>observation.source!=="learning")+1;
      const recent=summarize(evidence.slice(Math.max(lastChange+1,learningStart)));
      return recent;
    });
    const anyEvidence = modes.some(m => m.distinctItems > 0);
    const confirmed = modes.length > 0 && modes.every(m => m.confirmed);
    const status = !anyEvidence ? "unknown"
      : confirmed && modes.every(m => m.probability >= .85) ? "mastered"
      : confirmed && modes.every(m => m.probability <= .2) ? "missing"
      : confirmed ? "fragile" : "uncertain";
    return { skillId: skill.id, status, modes, resolved: confirmed && modes.every(m => m.probability >= .85 || m.probability <= .2), evidence: anyEvidence ? "direct" : "untested" };
  });
}

export type Selection =
  | { kind: "question"; item: Probe; reason: "branch_coverage" | "step_down" | "step_up" | "recheck_boundary" | "confirmation" | "gap_check" }
  | { kind: "provisional"; reason: "time_budget" | "later_evidence_required"; unresolvedSkillIds: string[] }
  | { kind: "finished"; reason: "evidence_complete" }
  | { kind: "coverage_gap"; unresolvedSkillIds: string[] };

export function knownExposedMaterialKeys(bank:readonly Probe[],observations:readonly Observation[],extraItemIds:readonly string[]=[],extraKeys:readonly string[]=[]):Set<string>{
 const itemIds=new Set([...observations.map(o=>o.itemId),...extraItemIds]);
 return new Set([...extraKeys,...bank.filter(probe=>itemIds.has(probe.id)).flatMap(probe=>probe.materialKeys??[]),
  ...observations.flatMap(o=>[...(o.materialReceipt?.firstRecordedKeys??[]),...(o.materialReceipt?.previouslySeenKeys??[])])]);
}
export function probeRepeatsKnownTarget(probe:Probe,skill:Skill,known:ReadonlySet<string>):boolean{
 const rule=skill.evidenceRequirements?.[probe.mode];
 return (probe.assessedMaterialKeys??probe.materialKeys??[]).some(key=>known.has(key)
  &&(key.startsWith("word:")?rule?.novelWordsRequired:key.startsWith("sentence:")?rule?.novelSentencesRequired:false));
}

/** Internal routing/readiness view only. Never publish these as mastery results. */
export function assessWithinOccasion(skills:readonly Skill[],observations:readonly Observation[],policy:Policy=DEFAULT_POLICY){
 const routingSkills=skills.map(skill=>({...skill,evidenceRequirements:skill.evidenceRequirements?
  Object.fromEntries(Object.entries(skill.evidenceRequirements).map(([mode,rule])=>[mode,{...rule,minimumOccasions:1}])):undefined}));
 return assessSkills(routingSkills,observations,policy);
}
/** Teach a sufficiently evidenced gap now; defer a strong result needing only
 * another occasion when the student has already supplied eligible evidence today. */
export function learningReadiness(skills:readonly Skill[],observations:readonly Observation[],at:number){
 if(!Number.isFinite(at)||at<0)throw Error("Invalid server timestamp");
 const unique=uniqueObservations(observations),official=assessSkills(skills,unique),within=assessWithinOccasion(skills,unique);
 const day=`learning-day:${new Date(at).toISOString().slice(0,10)}`;
 const today=assessSkills(skills,unique.filter(o=>o.occasionId===day));
 const deferredSkillIds:string[]=[];
 const planningResults=official.map((result,index)=>{
  const provisional=within[index];
  if(result.resolved)return result;
  // Provisional gaps already carry their teaching signal in the official
  // result. Preserve its uncertainty and actual occasion count for planning.
  const deferred=provisional.status==="mastered"&&provisional.resolved&&result.modes.filter(mode=>!mode.confirmed)
   .every(mode=>(today[index].modes.find(m=>m.mode===mode.mode)?.distinctItems??0)>0);
  if(deferred){deferredSkillIds.push(result.skillId);return provisional;}
  return result;
 });
 return {planningResults,deferredSkillIds};
}

export function selectProbe(skills: readonly Skill[], bank: readonly Probe[], observations: readonly Observation[], policy: Policy = DEFAULT_POLICY,extraKnownMaterialKeys:readonly string[]=[],releaseScope?:ReleaseScope): Selection {
  const scope=releaseScope===undefined?undefined:inspectReleaseScope(skills,releaseScope);
  const observed = uniqueObservations(observations);
  const categoryPriority=categoryExposurePriority(bank,observed.map(observation=>observation.itemId));
  const results = assessSkills(skills, observed, policy);
  const resultById = new Map(results.map(r => [r.skillId, r]));
  // Routing can move on once today's evidence is sufficient. It never publishes
  // mastery by pretending that several questions are several occasions.
  const routingById=new Map(assessWithinOccasion(skills,observed,policy).map(result=>[result.skillId,result]));
  const skillById = new Map(skills.map(s => [s.id, s]));
  const challengeOf = (skill: Skill) => skill.challengeOrder ?? skill.level;
  const unresolved = results.filter(r => !r.resolved).map(r => r.skillId);
  if (!unresolved.length) return { kind: "finished", reason: "evidence_complete" };
  const spent = observed.reduce((sum, o) => sum + Math.max(0, o.activeSeconds), 0);
  if (spent >= policy.activeSeconds) return { kind: "provisional", reason: "time_budget", unresolvedSkillIds: unresolved };
  const asked = new Set(observed.map(o => o.itemId));
  const knownMaterial=knownExposedMaterialKeys(bank,observed,[],extraKnownMaterialKeys);
  const available = bank.filter(item => {
    const skill = skillById.get(item.skillId);
    return skill && (!scope||scope.assessmentSkillIds.has(skill.id)) && skill.assessmentStage !== "learning" && item.usage!=="learning" && skill.modes.includes(item.mode) && !asked.has(item.id)
      && unresolved.includes(skill.id) && !routingById.get(skill.id)?.resolved && !probeRepeatsKnownTarget(item,skill,knownMaterial)
      && observed.filter(o => o.skillId === skill.id).length < policy.maxItemsPerSkill;
  });
  if (!available.length) {
    const initialUnresolved = unresolved.filter(id => (!scope||scope.assessmentSkillIds.has(id)) && skillById.get(id)?.assessmentStage !== "learning");
    const canRefineLater=initialUnresolved.every(id=>resultById.get(id)!.modes.filter(mode=>!mode.confirmed).every(mode=>bank.some(probe=>probe.skillId===id&&probe.mode===mode.mode&&probe.usage==="learning"&&!asked.has(probe.id)&&!probeRepeatsKnownTarget(probe,skillById.get(id)!,knownMaterial))));
    return initialUnresolved.length&&!canRefineLater ? { kind: "coverage_gap", unresolvedSkillIds: unresolved }
      : { kind: "provisional", reason: "later_evidence_required", unresolvedSkillIds: unresolved };
  }
  const domainOf = (skill: Skill) => skill.domain ?? skill.branch;
  const groupOf=(skill:Skill)=>skill.samplingGroup??domainOf(skill);
  const balance=(values:string[],history:readonly Observation[],key:(skill:Skill)=>string,tieRank:(value:string)=>number=()=>0)=>values.sort((a,b)=>{
    const entries=(value:string)=>history.filter(observation=>key(skillById.get(observation.skillId)!)===value);
    const left=entries(a),right=entries(b);
    const seconds=(observations:readonly Observation[])=>observations.reduce((sum,observation)=>sum+Math.max(0,observation.activeSeconds),0);
    // Count breaks zero-time ties so quick answers/skips cannot monopolize a domain.
    return seconds(left)-seconds(right)||left.length-right.length||tieRank(a)-tieRank(b)||a.localeCompare(b);
  });
  const domain=balance([...new Set(available.map(item=>domainOf(skillById.get(item.skillId)!)))],observed,domainOf)[0];
  const domainItems=available.filter(item=>domainOf(skillById.get(item.skillId)!)===domain);
  const domainHistory=observed.filter(observation=>domainOf(skillById.get(observation.skillId)!)===domain);
  const group=balance([...new Set(domainItems.map(item=>groupOf(skillById.get(item.skillId)!)))],domainHistory,groupOf)[0];
  const groupItems=domainItems.filter(item=>groupOf(skillById.get(item.skillId)!)===group);
  const groupHistory=domainHistory.filter(observation=>groupOf(skillById.get(observation.skillId)!)===group);
  // The refined French compiler already distinguishes individual verbs and
  // productive verb patterns in its pinned branch identities. Give both room
  // alongside general conjugation concepts; a large construction catalogue
  // must not consume all conjugation time before any verb form is assessed.
  // This schedules evidence only, never shares mastery across those families.
  const familyOf=(skill:Skill)=>groupOf(skill)==="conjugaison"
    ?skill.branch.startsWith("conjugation:verb:")?"individual_verbs"
      :skill.branch.startsWith("conjugation:pattern:")?"verb_patterns":"general_conjugation"
    :groupOf(skill);
  const family=balance([...new Set(groupItems.map(item=>familyOf(skillById.get(item.skillId)!)))],groupHistory,familyOf)[0];
  const allFamilyItems=groupItems.filter(item=>familyOf(skillById.get(item.skillId)!)===family);
  const allFamilyHistory=groupHistory.filter(observation=>familyOf(skillById.get(observation.skillId)!)===family);
  const formOf=(skill:Skill)=>skill.formFamily??"foundation";
  // Skips consume time and visit capacity, but carry no evidence about
  // difficulty. Only an actual answer can steer a recovery or boundary probe.
  const lastFamilyAnswer=allFamilyHistory.filter(observation=>!observation.skipped).at(-1);
  const lastFamilySkill=lastFamilyAnswer?skillById.get(lastFamilyAnswer.skillId):undefined;
  // A failed challenge may send the next visit across form families to an
  // actual prerequisite. Domain/strand/verb-family balance remains intact.
  const recovery=lastFamilyAnswer&&!lastFamilyAnswer.correct&&lastFamilySkill
    ?allFamilyItems.filter(item=>lastFamilySkill.prerequisites.includes(item.skillId)).sort((a,b)=>
      challengeOf(skillById.get(b.skillId)!)-challengeOf(skillById.get(a.skillId)!)||a.id.localeCompare(b.id)):[];
  const formPriority:Record<string,number>={foundation:0,simple:1,compound:2,periphrastic:3,contrast:4};
  const formCandidates=[...new Set(allFamilyItems.map(item=>formOf(skillById.get(item.skillId)!)))];
  // Survey each available form category across the whole strand, then revisit
  // in bounded groups. Repeating the survey separately for concepts, patterns
  // and individual verbs spent most conjugation time before confirmation.
  // Switching category after every answer left no conjugation target with
  // enough within-sitting evidence. The initial survey still reaches compound
  // forms early. Three is a routing parameter, not a mastery threshold.
  const formVisitRound=(form:string)=>{
    // Seeing a recognition item does not replace trying the form in production.
    const productionAvailable=allFamilyItems.some(item=>item.mode==="production"&&formOf(skillById.get(item.skillId)!)===form);
    if(!groupHistory.some(observation=>formOf(skillById.get(observation.skillId)!)===form&&(!productionAvailable||observation.mode==="production")))return 0;
    const count=allFamilyHistory.filter(observation=>formOf(skillById.get(observation.skillId)!)===form).length;
    return count===0?1:1+Math.floor((count-1)/3);
  };
  formCandidates.sort((a,b)=>formVisitRound(a)-formVisitRound(b)||(formPriority[a]??5)-(formPriority[b]??5)||a.localeCompare(b));
  const form=recovery.length?formOf(skillById.get(recovery[0].skillId)!):formCandidates[0];
  const familyItems=allFamilyItems.filter(item=>formOf(skillById.get(item.skillId)!)===form);
  const familyHistory=allFamilyHistory.filter(observation=>formOf(skillById.get(observation.skillId)!)===form);
  const branches=[...new Set(familyItems.map(item=>skillById.get(item.skillId)!.branch))];
  const branchCount=(branch:string)=>familyHistory.filter(observation=>skillById.get(observation.skillId)!.branch===branch).length;
  // Domain and strand time are still balanced on every question. Within the
  // selected strand, allow a bounded visit to collect confirmation and probe a
  // nearby boundary. Rotating after every item leaves large graphs with mostly
  // single-answer targets. Count skips too, so a visit can never trap a learner.
  const visitSize = Math.max(1, Math.floor(policy.itemsPerBranchVisit ?? 6));
  const entryDistanceByBranch=new Map<string,number>();
  for(const item of familyItems){
    const skill=skillById.get(item.skillId)!;
    const distance=Math.abs(challengeOf(skill)-policy.startingLevel);
    entryDistanceByBranch.set(skill.branch,Math.min(entryDistanceByBranch.get(skill.branch)??Infinity,distance));
  }
  // Equal-visit branches should start near the existing entry challenge, not
  // with whichever competency happens to sort first alphabetically. Rotation
  // still takes priority, and this ranking never supplies mastery evidence.
  branches.sort((a,b)=>Math.floor(branchCount(a)/visitSize)-Math.floor(branchCount(b)/visitSize)
    ||entryDistanceByBranch.get(a)!-entryDistanceByBranch.get(b)!||a.localeCompare(b));
  // Follow actual prerequisites across branch boundaries within the already
  // selected family. Domain/strand/family time balance still takes precedence.
  const recent=recovery.length?lastFamilyAnswer:familyHistory.filter(observation=>!observation.skipped).at(-1),recentSkill=recent?skillById.get(recent.skillId):undefined;
  const crossPrerequisites=recent&&!recent.correct&&recentSkill
    ?familyItems.filter(item=>recentSkill.prerequisites.includes(item.skillId)&&(skillById.get(item.skillId)!.branch!==recentSkill.branch||formOf(skillById.get(item.skillId)!)!==formOf(recentSkill))):[];
  crossPrerequisites.sort((a,b)=>challengeOf(skillById.get(b.skillId)!)-challengeOf(skillById.get(a.skillId)!)||a.id.localeCompare(b.id));
  const branch=crossPrerequisites.length?skillById.get(crossPrerequisites[0].skillId)!.branch:branches[0];
  const crossPrerequisiteIds=new Set(crossPrerequisites.filter(item=>skillById.get(item.skillId)!.branch===branch).map(item=>item.skillId));
  const branchItems=familyItems.filter(item=>skillById.get(item.skillId)!.branch===branch);
  const history=familyHistory.filter(observation=>skillById.get(observation.skillId)!.branch===branch);
  const last = history.filter(observation=>!observation.skipped).at(-1);
  const lastSkill = last ? skillById.get(last.skillId) : undefined;
  let reason: Extract<Selection, {kind: "question"}>["reason"] = "gap_check";
  let pool = branchItems;
  const restrict = (predicate: (item: Probe) => boolean, nextReason: typeof reason) => {
    const matches = branchItems.filter(predicate);
    if (!matches.length) return false;
    pool = matches; reason = nextReason; return true;
  };
  if (crossPrerequisiteIds.size && restrict(i => crossPrerequisiteIds.has(i.skillId), "step_down")) {
    // Probe the prerequisite; a failed advanced item does not score it as weak.
  } else if (restrict(i => skillById.get(i.skillId)!.anchor === true, "branch_coverage")) {
    // Explicit essentials are measured even when challenge routing would start higher.
  } else if (!lastSkill) {
    reason = "branch_coverage";
  } else if (!last?.correct) {
    // Prefer real prerequisites, then easier tasks in the same branch; no inference is recorded.
    if (!restrict(i => lastSkill.prerequisites.includes(i.skillId), "step_down")) {
      if (!restrict(i => challengeOf(skillById.get(i.skillId)!) < challengeOf(lastSkill), "step_down")) {
        if (!restrict(i => i.skillId === lastSkill.id && i.difficulty < (bank.find(p => p.id === last?.itemId)?.difficulty ?? 1), "step_down")) {
          // Already at the available floor: verify the difficulty on a fresh
          // context instead of drifting to another same-level target after a
          // single failure. Resolved targets are already absent from available.
          restrict(i => i.skillId === lastSkill.id, "confirmation");
        }
      }
    }
  } else {
    const lowerResolved = routingById.get(lastSkill.id)?.status === "mastered";
    const failedAbove = [...history].reverse().find(o => !o.skipped && !o.correct && challengeOf(skillById.get(o.skillId)!) > challengeOf(lastSkill));
    if (lowerResolved && failedAbove && restrict(i => i.skillId === failedAbove.skillId, "recheck_boundary")) {
      // The recovered foundation is confirmed; probe the earlier failure with a new item.
    } else if (lowerResolved && restrict(i => challengeOf(skillById.get(i.skillId)!) > challengeOf(lastSkill), "step_up")) {
      // Move up one available challenge level, not to a global proficiency band.
    } else {
      restrict(i => i.skillId === lastSkill.id, "confirmation");
    }
  }
  const selectedReason = reason as Extract<Selection, { kind: "question" }>["reason"];
  const targetLevel = selectedReason === "step_up" || selectedReason === "recheck_boundary"
    ? Math.min(...pool.map(i => challengeOf(skillById.get(i.skillId)!)))
    : selectedReason === "step_down" ? Math.max(...pool.map(i => challengeOf(skillById.get(i.skillId)!)))
    : lastSkill ? challengeOf(lastSkill) : policy.startingLevel;
  pool.sort((a, b) => {
    const priority = (item: Probe) => {
      const mode = resultById.get(item.skillId)!.modes.find(m => m.mode === item.mode)!;
      const contexts = observed.filter(o => o.skillId === item.skillId && o.mode === item.mode).map(o => o.contextId);
      return [Math.abs(challengeOf(skillById.get(item.skillId)!) - targetLevel), Number(mode.confirmed),
        Number(Boolean(mode.unconfirmedFeatures?.length)&&!item.evidenceFeatures?.some(feature=>mode.unconfirmedFeatures?.includes(feature))),
        Number((mode.textTypes?.length??0)<(skillById.get(item.skillId)!.evidenceRequirements?.[item.mode]?.minimumTextTypes??0)&&(!item.textType||mode.textTypes?.includes(item.textType))),
        Number((mode.contrastingErrorKeys?.length??0)<(skillById.get(item.skillId)!.evidenceRequirements?.[item.mode]?.minimumContrastingErrors??0)&&!item.contrastingErrorKeys?.some(key=>!mode.contrastingErrorKeys?.includes(key))),
        Number(skillById.get(item.skillId)!.evidenceRequirements?.[item.mode]?.negativeExamplesRequired&&!mode.negativeExampleConfirmed&&!item.negativeExampleAssessed),
        Number(contexts.includes(item.contextId)), mode.distinctItems,
        categoryPriority(item),
        Math.abs(item.difficulty - .5), item.expectedSeconds];
    };
    const left = priority(a), right = priority(b);
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return left[i] - right[i];
    return a.id.localeCompare(b.id);
  });
  if (pool[0].expectedSeconds > policy.activeSeconds - spent) return { kind: "provisional", reason: "time_budget", unresolvedSkillIds: unresolved };
  return { kind: "question", item: pool[0], reason };
}
