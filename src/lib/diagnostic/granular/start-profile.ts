import {ADAPTIVE_ROUTING_V1,type Policy,type Probe,type Skill} from "./engine";
import {inspectReleaseScope,type ReleaseScope} from "./release-scope";
/** Profile-based starting points for the granular diagnostic. Pure and
 * versioned: the resolved profile is stored on the session, so resume, pulses
 * and learning successors reproduce it. Starting points only choose the first
 * probes of each domain. They never supply evidence or change any result. */
export const START_PROFILE_VERSION="start-profile-v1" as const;
export type StartBand="sl_beginner"|"sl_extended"|"heritage_home"|"first_language";
export type GradeTier="5-6"|"7-8"|"9-10"|"11-12";
export type StartProfileInput={grade?:number|null;studentType?:string|null;frenchBackground?:string|null;
 exposures?:readonly string[]|null;exposure?:string|null;goalType?:string|null;targetLevel?:string|null};
export type StartProfile={version:typeof START_PROFILE_VERSION;routing:string;band:StartBand|"default";gradeTier:GradeTier|null;
 inputs:{grade:number|null;studentType:string|null;exposures:string[];goalType:string|null;targetLevel:string|null};
 levels:Record<string,number>};

const TIERS:readonly GradeTier[]=["5-6","7-8","9-10","11-12"];
/** Entry challenge per domain as [grade 5-6, 7-8, 9-10, 11-12], on the
 * release's challengeOrder scale (v45 in-scope ranges: conjugation 0-6,
 * grammar 0-5, spelling 0-2, reading_comprehension 0/1/3). Rationale:
 * - sl_beginner: French only as a school subject; start at the foundations.
 * - sl_extended: immersion, French schooling or self-study; comprehension runs
 *   ahead of written conventions, so reading starts higher than spelling.
 * - heritage_home: French heard/spoken at home; strong reading and grammar in
 *   use, but spelling and written conventions often lag oral competence.
 * - first_language: schooled in French at grade level; highest in all domains.
 * Values are snapped to levels that actually have probes in the release.
 * They are routing choices for review by the diagnostic's designers. */
export const START_LEVELS:Readonly<Record<StartBand,Readonly<Record<string,readonly [number,number,number,number]>>>>={
 sl_beginner:   {conjugation:[0,1,1,2],grammar:[0,0,1,1],spelling:[0,0,1,1],reading_comprehension:[0,0,1,1]},
 sl_extended:   {conjugation:[1,2,2,3],grammar:[1,1,2,3],spelling:[0,1,1,1],reading_comprehension:[1,1,1,3]},
 heritage_home: {conjugation:[1,2,3,3],grammar:[2,2,3,4],spelling:[0,0,1,1],reading_comprehension:[1,3,3,3]},
 first_language:{conjugation:[2,3,4,5],grammar:[1,2,4,4],spelling:[1,1,2,2],reading_comprehension:[1,3,3,3]},
};
/** Today's behaviour for a missing or unknown profile. */
export const DEFAULT_START_LEVEL=1;
const STUDENT_TYPES=new Set(["french_first_language","french_second_language","heritage","bilingual","allophone","immersion"]);
const EXPOSURES=new Set(["home","school","class_only","immersion","self_study"]);

function nearest(levels:readonly number[]|undefined,value:number){
 if(!levels?.length)return value;
 return [...levels].sort((a,b)=>a-b).reduce((best,level)=>Math.abs(level-value)<Math.abs(best-value)?level:best);
}
/** Mirrors onboardingTarget: an explicit type wins, else the legacy background. */
export function startStudentType(input:Pick<StartProfileInput,"studentType"|"frenchBackground">):string|null{
 if(input.studentType&&STUDENT_TYPES.has(input.studentType))return input.studentType;
 if(!input.frenchBackground)return null;
 return input.frenchBackground==="native"?"french_first_language":input.frenchBackground==="bilingual"?"bilingual":"french_second_language";
}
export function startBand(studentType:string|null,exposures:readonly string[]):StartBand|null{
 if(!studentType)return null;
 if(studentType==="french_first_language")return "first_language";
 if(studentType==="heritage"||studentType==="bilingual"||exposures.includes("home"))return "heritage_home";
 if(studentType==="immersion"||exposures.some(value=>value==="immersion"||value==="school"||value==="self_study"))return "sl_extended";
 return "sl_beginner";
}
export function gradeTier(grade:number|null|undefined):GradeTier|null{
 if(!Number.isInteger(grade)||grade!<5||grade!>12)return null;
 return TIERS[Math.floor((grade!-5)/2)];
}
/** Sorted challenge levels with initial probes, per domain, in release scope. */
export function domainChallengeLevels(skills:readonly Skill[],probes:readonly Probe[],releaseScope?:ReleaseScope):Record<string,number[]>{
 const scope=releaseScope===undefined?undefined:inspectReleaseScope(skills,releaseScope);
 const probed=new Set(probes.filter(probe=>probe.usage!=="learning").map(probe=>probe.skillId));
 const levels:Record<string,Set<number>>={};
 for(const skill of skills){
  if(skill.assessmentStage==="learning"||!probed.has(skill.id)||(scope&&!scope.assessmentSkillIds.has(skill.id)))continue;
  (levels[skill.domain??skill.branch]??=new Set()).add(skill.challengeOrder??skill.level);
 }
 return Object.fromEntries(Object.entries(levels).map(([domain,values])=>[domain,[...values].sort((a,b)=>a-b)]));
}
/** Goals are recorded for audit but do not move the start: a class goal is
 * not a claim about current proficiency (see onboardingTarget). */
export function resolveStartProfile(input:StartProfileInput|null|undefined,available:Readonly<Record<string,readonly number[]>>):StartProfile{
 const exposures=[...new Set((input?.exposures?.length?input.exposures:input?.exposure?[input.exposure]:[]).filter(value=>EXPOSURES.has(value)))];
 const studentType=input?startStudentType(input):null;
 const tier=gradeTier(input?.grade),band=tier?startBand(studentType,exposures):null;
 const levels=Object.fromEntries(Object.keys(available).sort().map(domain=>{
  const row=band?START_LEVELS[band][domain]:undefined;
  return [domain,nearest(available[domain],row?row[TIERS.indexOf(tier!)]:DEFAULT_START_LEVEL)];
 }));
 return {version:START_PROFILE_VERSION,routing:ADAPTIVE_ROUTING_V1.version,band:band??"default",gradeTier:band?tier:null,
  inputs:{grade:Number.isInteger(input?.grade)?input!.grade!:null,studentType,exposures,goalType:input?.goalType??null,targetLevel:input?.targetLevel??null},levels};
}
/** Resolve against the levels a published assessment actually probes. */
export function startProfileForAssessment(assessment:{skills:readonly Skill[];probes?:readonly Probe[];releaseScope?:ReleaseScope},input:StartProfileInput|null|undefined):StartProfile{
 return resolveStartProfile(input,domainChallengeLevels(assessment.skills??[],assessment.probes??[],assessment.releaseScope));
}
/** Routing policy for a session. Sessions without a stored profile predate
 * this module and keep their original single start and routing. */
export function policyWithStartProfile(policy:Policy,profile:StartProfile|undefined|null):Policy{
 if(!profile||profile.version!==START_PROFILE_VERSION)return policy;
 const startingLevels=Object.fromEntries(Object.entries(profile.levels??{}).filter(([,level])=>Number.isFinite(level)));
 return {...policy,startingLevels,...(profile.routing===ADAPTIVE_ROUTING_V1.version?{adaptiveRouting:ADAPTIVE_ROUTING_V1}:{})};
}
