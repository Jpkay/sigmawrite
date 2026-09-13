/** Explicit operator input. A missing flag keeps the original authoring bank. */
export function granularBankOptions(args:readonly string[]):{revision?:number;verbFamilyRecognition?:boolean;etreParticipleAgreement?:boolean;questionDetailReading?:boolean;localDefinitionReading?:boolean;avoirParticipleAgreement?:boolean;causalReadingGenres?:boolean;causeRelationFamily?:boolean}{
 const flags=args.flatMap((arg,index)=>arg==='--bank-revision'?[index]:[]);
 const causeRelationFlags=args.filter(arg=>arg==='--cause-relation-family');
 if(causeRelationFlags.length>1)throw Error('Duplicate cause relation family option');
 const causalFlags=args.filter(arg=>arg==='--causal-reading-genres');
 if(causalFlags.length>1)throw Error('Duplicate causal reading genres option');
 const avoirFlags=args.filter(arg=>arg==='--avoir-participle-agreement');
 if(avoirFlags.length>1)throw Error('Duplicate avoir agreement option');
 const definitionFlags=args.filter(arg=>arg==='--local-definition-reading');
 if(definitionFlags.length>1)throw Error('Duplicate local-definition reading option');
 const readingFlags=args.filter(arg=>arg==='--question-detail-reading');
 if(readingFlags.length>1)throw Error('Duplicate question-detail reading option');
 const agreementFlags=args.filter(arg=>arg==='--etre-participle-agreement');
 if(agreementFlags.length>1)throw Error('Duplicate etre agreement option');
 const familyFlags=args.filter(arg=>arg==='--verb-family-recognition');
 if(familyFlags.length>1)throw Error('Duplicate verb-family recognition option');
 if(!flags.length){if(causeRelationFlags.length)throw Error('Cause relation family requires bank revision 42 or later and preceding refinements');if(causalFlags.length)throw Error('Causal reading genres require bank revision 41 or later and preceding refinements');if(avoirFlags.length)throw Error('Avoir agreement requires bank revision 40 or later and preceding refinements');if(definitionFlags.length)throw Error('Local-definition reading requires bank revision 39 or later and preceding refinements');if(readingFlags.length)throw Error('Question-detail reading requires bank revision 38 or later and preceding refinements');if(agreementFlags.length)throw Error('Etre agreement requires bank revision 37 or later and verb-family recognition');if(familyFlags.length)throw Error('Verb-family recognition requires bank revision 36 or later');return {};}
 const value=args[flags[0]+1];
 if(flags.length!==1||!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||String(Number(value))!==value)throw Error('--bank-revision requires one positive integer without leading zeroes');
 if(familyFlags.length&&Number(value)<36)throw Error('Verb-family recognition requires bank revision 36 or later');
 if(agreementFlags.length&&(Number(value)<37||!familyFlags.length))throw Error('Etre agreement requires bank revision 37 or later and verb-family recognition');
 if(readingFlags.length&&(Number(value)<38||!agreementFlags.length||!familyFlags.length))throw Error('Question-detail reading requires bank revision 38 or later and preceding refinements');
 if(definitionFlags.length&&(Number(value)<39||!readingFlags.length||!agreementFlags.length||!familyFlags.length))throw Error('Local-definition reading requires bank revision 39 or later and preceding refinements');
 if(avoirFlags.length&&(Number(value)<40||!definitionFlags.length))throw Error('Avoir agreement requires bank revision 40 or later and preceding refinements');
 if(causalFlags.length&&(Number(value)<41||!avoirFlags.length))throw Error('Causal reading genres require bank revision 41 or later and preceding refinements');
 if(causeRelationFlags.length&&(Number(value)<42||!causalFlags.length||!avoirFlags.length||!definitionFlags.length||!readingFlags.length||!agreementFlags.length||!familyFlags.length))throw Error('Cause relation family requires bank revision 42 or later and preceding refinements');
 return {revision:Number(value),...(familyFlags.length?{verbFamilyRecognition:true}:{}),...(agreementFlags.length?{etreParticipleAgreement:true}:{}),...(readingFlags.length?{questionDetailReading:true}:{}),...(definitionFlags.length?{localDefinitionReading:true}:{}),...(avoirFlags.length?{avoirParticipleAgreement:true}:{}),...(causalFlags.length?{causalReadingGenres:true}:{}),...(causeRelationFlags.length?{causeRelationFamily:true}:{})};
}
