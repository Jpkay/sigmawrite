import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {ExerciseFormat,Probe,RoutePurpose,VerbTenseBand} from "./engine";

export const R45_ROUTE_COVERAGE_POLICY={
 version:"r45-core-route-coverage-v1" as const,
 minimumExerciseFormatsPerCoreDomain:2,
 requiredVerbTenseBands:["present","past","future"] as const,
 maxSpellingTopicVisit:4,
};
export type RouteCoveragePolicy=typeof R45_ROUTE_COVERAGE_POLICY;

function verbTenseBand(entry:CanonicalDiagnosticBankArtifact["items"][number]):VerbTenseBand|undefined{
 if(entry.sectionKey!=="conjugation")return undefined;
 const tense=entry.item.validatorConfig?.tense;
 if(typeof tense!=="string")return undefined;
 if(tense==="present"||tense==="present_indicatif")return "present";
 if(tense.includes("futur"))return "future";
 if(tense.includes("passe")||tense==="imparfait"||tense==="plus_que_parfait")return "past";
 return undefined;
}

function routePurpose(entry:CanonicalDiagnosticBankArtifact["items"][number]):RoutePurpose|undefined{
 if(entry.evidenceExpectation!=="controlled_production")return undefined;
 return entry.sectionKey==="conjugation"?"verb_tense_use":entry.sectionKey==="grammar"?"grammar_use":undefined;
}

/** Join release-owned presentation metadata onto the selector's compact probe
 * records. Historical assessment JSON did not store responseType, while every
 * pinned canonical bank does. The bank remains authoritative. */
export function withRouteCoverageMetadata(probes:readonly Probe[],bank:CanonicalDiagnosticBankArtifact):Probe[]{
 const metadata=new Map(bank.items.map(entry=>[entry.itemKey,{exerciseFormat:entry.item.responseType as ExerciseFormat,routePurpose:routePurpose(entry),verbTenseBand:verbTenseBand(entry),routeTopic:entry.item.nodeKey}]));
 return probes.map(probe=>{
  const route=metadata.get(probe.id);
  return route===undefined||probe.exerciseFormat===route.exerciseFormat&&probe.routePurpose===route.routePurpose&&probe.verbTenseBand===route.verbTenseBand&&probe.routeTopic===route.routeTopic?probe:{...probe,...route};
 });
}
