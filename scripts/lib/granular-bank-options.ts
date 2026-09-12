/** Explicit operator input. A missing flag keeps the original authoring bank. */
export function granularBankOptions(args:readonly string[]):{revision?:number;verbFamilyRecognition?:boolean}{
 const flags=args.flatMap((arg,index)=>arg==='--bank-revision'?[index]:[]);
 const familyFlags=args.filter(arg=>arg==='--verb-family-recognition');
 if(familyFlags.length>1)throw Error('Duplicate verb-family recognition option');
 if(!flags.length){if(familyFlags.length)throw Error('Verb-family recognition requires bank revision 36 or later');return {};}
 const value=args[flags[0]+1];
 if(flags.length!==1||!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||String(Number(value))!==value)throw Error('--bank-revision requires one positive integer without leading zeroes');
 if(familyFlags.length&&Number(value)<36)throw Error('Verb-family recognition requires bank revision 36 or later');
 return {revision:Number(value),...(familyFlags.length?{verbFamilyRecognition:true}:{})};
}
