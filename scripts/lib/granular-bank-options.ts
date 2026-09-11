/** Explicit operator input. A missing flag keeps the original authoring bank. */
export function granularBankOptions(args:readonly string[]):{revision?:number}{
 const flags=args.flatMap((arg,index)=>arg==='--bank-revision'?[index]:[]);
 if(!flags.length)return {};
 const value=args[flags[0]+1];
 if(flags.length!==1||!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||String(Number(value))!==value)throw Error('--bank-revision requires one positive integer without leading zeroes');
 return {revision:Number(value)};
}
