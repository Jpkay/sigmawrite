export type ConstructionFeature = {
  key: string;
  count: number;
  examples: string[];
};

export type ConstructionAnalysis = {
  features: ConstructionFeature[];
  totalCount: number;
  distinctCount: number;
  complexityScore: number;
};

type Rule = { key: string; pattern: RegExp; weight: number };

const RULES: Rule[] = [
  { key: "construction_coordination", pattern: /\b(?:et|ou|mais|donc|or|ni|car)\b/giu, weight: 1 },
  { key: "construction_subordonnee_relative", pattern: /\b(?:qui|que|dont|où|lequel|laquelle|lesquels|lesquelles)\b/giu, weight: 2 },
  { key: "construction_subordonnee_completive", pattern: /\b(?:pense|penses|pensons|crois|croit|savons|sait|dit|disent|explique|affirme)\s+qu['e]\b/giu, weight: 2 },
  { key: "construction_subordonnee_circonstancielle", pattern: /\b(?:lorsqu(?:e|['’])|quand|puisqu(?:e|['’])|parce qu(?:e|['’])|afin qu(?:e|['’])|pour qu(?:e|['’])|bien qu(?:e|['’])|tandis qu(?:e|['’])|alors qu(?:e|['’])|si)/giu, weight: 2 },
  { key: "construction_negation_simple", pattern: /\bn['e]\s+[\p{L}'’-]+\s+pas\b/giu, weight: 1 },
  { key: "construction_negation_complexe", pattern: /\bn['e]\s+[\p{L}'’-]+\s+(?:plus|jamais|rien|personne|guère)\b/giu, weight: 2 },
  { key: "construction_pronom_objet", pattern: /\b(?:me|m'|te|t'|le|la|les|lui|leur|en|y)\s+[\p{L}'’-]+/giu, weight: 2 },
  { key: "construction_reprise_demonstrative", pattern: /\b(?:celui|celle|ceux|celles|cela|ça|ceci)\b/giu, weight: 2 },
  { key: "relation_cause", pattern: /\b(?:parce qu(?:e|['’])|puisqu(?:e|['’])|car\b|en raison de|à cause de|grâce à)/giu, weight: 1 },
  { key: "relation_consequence", pattern: /\b(?:donc|ainsi|par conséquent|c'est pourquoi|de sorte que)\b/giu, weight: 1 },
  { key: "relation_contraste", pattern: /\b(?:mais|pourtant|cependant|néanmoins|en revanche|alors que|tandis que)\b/giu, weight: 1 },
  { key: "relation_concession", pattern: /\b(?:bien qu(?:e|['’])|même si|malgré|quoiqu(?:e|['’]))/giu, weight: 2 },
  { key: "relation_chronologie", pattern: /\b(?:d'abord|ensuite|puis|avant|après|enfin|soudain|pendant que)\b/giu, weight: 1 },
  { key: "relation_addition", pattern: /\b(?:de plus|en outre|également|aussi)\b/giu, weight: 1 },
  { key: "relation_exemple_reformulation", pattern: /\b(?:par exemple|autrement dit|c'est-à-dire|notamment)\b/giu, weight: 1 },
  { key: "construction_discours_rapporte", pattern: /(?:[«“][^»”]+[»”]|\b(?:dit|déclare|demande|répond|affirme)\s+(?:que|:)\b)/giu, weight: 2 },
  { key: "construction_voix_passive", pattern: /\b(?:est|sont|était|étaient|sera|seront|a été|ont été)\s+[\p{L}]+(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues)(?![\p{L}])/giu, weight: 3 },
  { key: "construction_nominalisation", pattern: /\b[\p{L}]+(?:tion|sion|ment|age|ité|ance|ence)\b/giu, weight: 2 },
];

function sentenceAt(text: string, index: number): string {
  const start = Math.max(text.lastIndexOf(".", index), text.lastIndexOf("!", index), text.lastIndexOf("?", index)) + 1;
  const candidates = [text.indexOf(".", index), text.indexOf("!", index), text.indexOf("?", index)].filter((value) => value >= 0);
  const end = candidates.length > 0 ? Math.min(...candidates) + 1 : text.length;
  return text.slice(start, end).trim();
}

export function analyzeConstructions(text: string): ConstructionAnalysis {
  const features: ConstructionFeature[] = [];
  let weighted = 0;
  for (const rule of RULES) {
    const matches = [...text.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags))];
    if (matches.length === 0) continue;
    features.push({
      key: rule.key,
      count: matches.length,
      examples: [...new Set(matches.slice(0, 3).map((match) => sentenceAt(text, match.index ?? 0)))],
    });
    weighted += matches.length * rule.weight;
  }
  features.sort((left, right) => left.key.localeCompare(right.key));
  return {
    features,
    totalCount: features.reduce((sum, feature) => sum + feature.count, 0),
    distinctCount: features.length,
    complexityScore: Math.min(100, weighted * 4),
  };
}

export function constructionCount(analysis: ConstructionAnalysis, key: string): number {
  return analysis.features.find((feature) => feature.key === key)?.count ?? 0;
}
