/** Explicit operator input. A missing flag keeps the original authoring bank. */
export function granularBankOptions(args:readonly string[]):{revision?:number;verbFamilyRecognition?:boolean;etreParticipleAgreement?:boolean}{
 const flags=args.flatMap((arg,index)=>arg==='--bank-revision'?[index]:[]);
 const agreementFlags=args.filter(arg=>arg==='--etre-participle-agreement');
 if(agreementFlags.length>1)throw Error('Duplicate etre agreement option');
 const familyFlags=args.filter(arg=>arg==='--verb-family-recognition');
 if(familyFlags.length>1)throw Error('Duplicate verb-family recognition option');
 if(!flags.length){if(agreementFlags.length)throw Error('Etre agreement requires bank revision 37 or later and verb-family recognition');if(familyFlags.length)throw Error('Verb-family recognition requires bank revision 36 or later');return {};}
 const value=args[flags[0]+1];
 if(flags.length!==1||!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||String(Number(value))!==value)throw Error('--bank-revision requires one positive integer without leading zeroes');
 if(familyFlags.length&&Number(value)<36)throw Error('Verb-family recognition requires bank revision 36 or later');
 if(agreementFlags.length&&(Number(value)<37||!familyFlags.length))throw Error('Etre agreement requires bank revision 37 or later and verb-family recognition');
 return {revision:Number(value),...(familyFlags.length?{verbFamilyRecognition:true}:{}),...(agreementFlags.length?{etreParticipleAgreement:true}:{})};
}
