/** Display names only. They do not add evidence, requirements or mastery. */
const LABELS:Readonly<Record<string,string>>={
 'complex-negation:plus':'Ne…plus',
 'complex-negation:jamais':'Ne…jamais',
 'complex-negation:rien':'Ne…rien',
 'complex-negation:personne':'Ne…personne',
 'complex-negation:guere':'Ne…guère',
 'written-syllable:simple':'Syllabes simples',
 'written-syllable:double_consonant':'Syllabes avec une consonne double',
 'written-syllable:consonant_group':'Syllabes avec un groupe de consonnes',
 'phoneme-graphie:ch':'Le son « ch »',
 'phoneme-graphie:ou':'Le son « ou »',
 'phoneme-graphie:gn':'Le son « gn »',
 'phoneme-graphie:f':'Le son « f »',
 'direct-object-avoir':'Cas avec avoir et un complément direct',
 'no-direct-object-etre':'Cas avec être, sans complément direct',
 'spelling-adjustment':'Changements d’orthographe du verbe',
};
export function featureLabel(feature:string):string|undefined{return LABELS[feature];}
