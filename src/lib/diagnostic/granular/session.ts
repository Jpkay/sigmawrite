import {inspectReleaseScope,type ReleaseScope} from "./release-scope";
import type {ObservedMaterialReceipt} from "./material-receipt";
import {learningSeenQuestionIds} from "./learning-exposure";
import {verifiedWritingEvidence,type WritingEvidence} from "./writing-evidence";
import { assessSkills, DEFAULT_POLICY, selectProbe, type Observation, type Policy, type Probe, type Skill } from "./engine";
import { buildGranularPriorities } from "./pathway";

export type Release = { taxonomyId: string; bankId: string; checksum: string };
export type AssessmentSession = {
  version: 1;
  release: Release;
  revision: number;
  occasionId: string;
  phase: "assessing" | "learning";
  paused: boolean;
  activeSeconds: number;
  lastPulseAt: number | null;
  pendingItemId: string | null;
  pendingActiveSeconds: number;
  observations: Observation[];
  /** Submitted answers for review; absent on historical sessions. Never infer
   * missing answers from the grade or use this record as mastery evidence. */
  diagnosticResponses?: Array<{itemId:string;answer:string;supportChoiceId?:string}>;
  refinements: Observation[];
  exposedLearningItemIds: string[];
  /** Actual reading passages presented in this session, even if unanswered. */
  exposedReadingContexts?: string[];
  exposedMaterialKeys?:string[];
  learningCheck?: {id:string;activityId:string;itemId:string;occasionId:string;firstDraft?:string}|null;
  teaching?: {activityId:string;contentId:string;exerciseIndex:number;phase:"lesson"|"practice";
    responses:Array<{exerciseId:string;answer:string;correct:boolean;hintUsed:boolean}>;hintUsed:boolean}|null;
  completedTeachingIds?:string[];
  completionReason: "evidence_complete" | "time_budget" | "later_evidence_required" | "coverage_gap" | null;
};
export type SessionEvent =
  | { type: "pulse"; at: number }
  | { type: "pause"; at: number }
  | { type: "resume"; at: number }
  | { type: "answer"; at: number; itemId: string; correct: boolean; materialReceipt?:ObservedMaterialReceipt }
  | { type:"skip";at:number;itemId:string }
  | { type: "issue_check"; check:{id:string;activityId:string;itemId:string;occasionId:string} }
  | { type: "answer_check"; checkId:string; correct:boolean; materialReceipt?:ObservedMaterialReceipt;writingEvidence?:WritingEvidence }
  | { type: "save_writing_draft";checkId:string;answer:string }
  | { type: "abandon_check"; checkId:string }
  | { type: "refine"; itemId: string; correct: boolean; independent: boolean; hintsUsed: boolean; firstAttempt: boolean; occasionId: string };
export type SessionView = {
  phase: AssessmentSession["phase"];
  paused: boolean;
  provisional: boolean;
  remainingSeconds: number;
  pendingItemId: string | null;
  results: ReturnType<typeof assessSkills>;
  priorities: ReturnType<typeof buildGranularPriorities>;
};

/** Pure transition layer for a future authenticated, transactional persistence adapter.
 * `at` must be a server timestamp, and `correct` a server grading result. Never accept
 * either value, the release, or the observations from an untrusted browser payload.
 * A visible, unpaused client sends a heartbeat at least every 15 seconds. Gaps beyond
 * 30 seconds are not charged, so disconnected/closed tabs cannot consume a sitting.
 */
export function createSession(release: Release): AssessmentSession {
  if (!release.taxonomyId || !release.bankId || !release.checksum) throw new Error("A pinned release is required");
  return { version: 1, release: { ...release }, revision: 0, occasionId: "initial-diagnostic", phase: "assessing", paused: true,
    activeSeconds: 0, lastPulseAt: null, pendingItemId: null, pendingActiveSeconds: 0,
    observations: [], refinements: [], exposedLearningItemIds: [], completionReason: null };
}

export function transitionSession(input: {
  state: AssessmentSession; release: Release; expectedRevision: number; event: SessionEvent;
  skills: readonly Skill[]; bank: readonly Probe[]; policy?: Policy; releaseScope?:ReleaseScope;
}): AssessmentSession {
  const { state, release, event, skills, bank } = input;
  const policy = input.policy ?? DEFAULT_POLICY;
  const scope=input.releaseScope===undefined?undefined:inspectReleaseScope(skills,input.releaseScope);
  if (state.release.taxonomyId !== release.taxonomyId || state.release.bankId !== release.bankId || state.release.checksum !== release.checksum) {
    throw new Error("Assessment release changed; resume against the pinned release");
  }
  if (state.revision !== input.expectedRevision) throw new Error("Stale assessment revision");
  const next: AssessmentSession = structuredClone(state);
  const findItem = (id: string) => {
    const item = bank.find(p => p.id === id);
    if (!item || !skills.some(s => s.id === item.skillId && s.modes.includes(item.mode))) throw new Error("Item does not belong to this assessment");
    if(scope&&!scope.assessmentSkillIds.has(item.skillId))throw new Error("Question outside assessment release scope");
    if(next.phase==="learning"&&item.usage==="initial")throw new Error("Initial-only question cannot be used as a learning check");
    if(next.phase==="assessing"&&item.usage==="learning")throw new Error("Learning reserve cannot be used in the initial diagnostic");
    return item;
  };
  const record = (item: Probe, correct: boolean, activeSeconds: number): Observation => ({
    ...(next.phase==="learning"?{source:"learning" as const}:{}),
    itemId: item.id, skillId: item.skillId, mode: item.mode, contextId: item.contextId,
    correct, guessProbability: item.guessProbability, activeSeconds, occasionId: next.occasionId, unaided: true,evidenceFeatures:item.evidenceFeatures?[...item.evidenceFeatures]:undefined,textualSupportAssessed:item.textualSupportAssessed===true,textType:item.textType,negativeExampleAssessed:item.negativeExampleAssessed===true,contrastingErrorKeys:item.contrastingErrorKeys?[...item.contrastingErrorKeys]:undefined,
  });
  const complete = (reason: NonNullable<AssessmentSession["completionReason"]>) => {
    next.phase = "learning"; next.completionReason = reason;
    next.pendingItemId = null; next.pendingActiveSeconds = 0;
    next.paused = true; next.lastPulseAt = null;
  };
  if(event.type==="issue_check"||event.type==="answer_check"||event.type==="abandon_check"||event.type==="save_writing_draft"){
    if(next.phase!=="learning"||next.completionReason==="coverage_gap")throw Error("Learning has not started");
    if(event.type==="issue_check"){
      if(next.teaching)throw Error("Finish or leave guided practice before an independent check");
      if(next.learningCheck)throw Error("A learning check is already active");
      const item=findItem(event.check.itemId);
      if(!event.check.id.trim()||!event.check.activityId.trim()||!event.check.occasionId.trim())throw Error("Invalid server-issued check");
      if(learningSeenQuestionIds(next,bank).has(item.id))throw Error("Learning check was already exposed");
      next.learningCheck={...event.check};
    }else{
      const check=next.learningCheck;
      if(!check||check.id!==event.checkId)throw Error("Learning check is no longer active");
      const item=findItem(check.itemId);
      if(event.type==="save_writing_draft"){
        if(item.mode!=="independent_production"||check.firstDraft!==undefined||!event.answer.trim()||event.answer.length>3000)throw Error("Invalid initial writing draft");
        next.learningCheck={...check,firstDraft:event.answer};next.revision++;return next;
      }
      next.exposedLearningItemIds.push(item.id);
      if(event.type==="answer_check"){
        if(event.writingEvidence&&(item.mode!=="independent_production"||!verifiedWritingEvidence(event.writingEvidence,item.skillId)))throw Error("Writing evidence does not match the active skill");
        next.refinements.push({...record(item,event.correct,0),materialReceipt:event.materialReceipt,writingEvidence:event.writingEvidence?structuredClone(event.writingEvidence):undefined,occasionId:check.occasionId});
      }
      next.learningCheck=null;
    }
  } else if (event.type === "refine") {
    if (next.phase !== "learning") throw new Error("Learning has not started");
    if(next.learningCheck?.itemId===event.itemId)throw Error("Use the active server-issued check");
    const item = findItem(event.itemId);
    // Guided practice is useful for teaching, but cannot certify independent mastery.
    if (learningSeenQuestionIds(next,bank).has(item.id)) return state;
    next.exposedLearningItemIds.push(item.id);
    if (event.independent && !event.hintsUsed && event.firstAttempt) {
      if (!event.occasionId.trim()) throw new Error("Learning evidence needs a server-owned occasion");
      next.refinements.push({ ...record(item, event.correct, 0), occasionId: event.occasionId });
    }
  } else {
    if (!Number.isFinite(event.at) || event.at < 0) throw new Error("Invalid server timestamp");
    // Retrying an accepted answer is idempotent and must not consume time twice.
    if ((event.type === "answer"||event.type === "skip") && next.observations.some(o => o.itemId === event.itemId)) return state;
    if (next.phase === "learning") return state;
    if (event.type === "pulse" && next.paused) return state;
    if (next.lastPulseAt !== null && event.at < next.lastPulseAt) throw new Error("Clock moved backwards");
    if ((event.type === "answer"||event.type === "skip") && (next.paused || next.pendingItemId !== event.itemId)) throw new Error("Answer does not match the active question");
    if (!next.paused && next.lastPulseAt !== null) {
      const elapsed = Math.min(30, (event.at - next.lastPulseAt) / 1000);
      next.activeSeconds += elapsed; next.pendingActiveSeconds += elapsed;
    }
    if (event.type === "pause") {
      next.paused = true; next.lastPulseAt = null;
    } else {
      next.paused = false; next.lastPulseAt = event.at;
    }
    if (event.type === "answer"||event.type === "skip") {
      next.observations.push({...record(findItem(event.itemId), event.type==="answer"?event.correct:false, next.pendingActiveSeconds),occasionId:`learning-day:${new Date(event.at).toISOString().slice(0,10)}`,...(event.type==="skip"?{skipped:true as const}:{materialReceipt:event.materialReceipt})});
      next.pendingItemId = null; next.pendingActiveSeconds = 0;
    }
    if (next.activeSeconds >= policy.activeSeconds) complete("time_budget");
    else if (!next.paused && !next.pendingItemId) {
      const selection = selectProbe(skills, bank.filter(probe=>!next.exposedReadingContexts?.includes(probe.contextId)), next.observations, policy,next.exposedMaterialKeys??[],input.releaseScope);
      if (selection.kind === "question") next.pendingItemId = selection.item.id;
      else complete(selection.kind === "finished" ? "evidence_complete" : selection.kind === "provisional" ? selection.reason : "coverage_gap");
    }
  }
  const presented=bank.find(probe=>probe.id===(next.learningCheck?.itemId??next.pendingItemId));
  if(presented?.contextId.startsWith("passage-content:"))next.exposedReadingContexts=[...new Set([...(next.exposedReadingContexts??[]),presented.contextId])];
  next.revision++;
  return next;
}

export function sessionView(state: AssessmentSession, skills: readonly Skill[], policy: Policy = DEFAULT_POLICY): SessionView {
  const results = assessSkills(skills, assessmentObservations(state), policy);
  return { phase: state.phase, paused: state.paused, provisional: results.some(r => !r.resolved),
    remainingSeconds: Math.max(0, policy.activeSeconds - state.activeSeconds), pendingItemId: state.pendingItemId,
    results, priorities: state.phase === "learning" ? buildGranularPriorities(skills, results) : [] };
}

/** Saved refinements predate the source marker in older sessions; the server-owned
 * collection already establishes that they are independent learning evidence. */
export function assessmentObservations(state:AssessmentSession):Observation[]{
 return [...state.observations,...state.refinements.map(observation=>({...observation,source:"learning" as const}))];
}
