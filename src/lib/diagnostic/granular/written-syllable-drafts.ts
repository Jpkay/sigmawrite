/** Written segmentation, not oral syllable counting or line-wrap typography. */
export type WrittenSyllableDraft={key:string;mode:'recognition'|'production';word:string;segmented:string;pattern:'simple'|'double_consonant'|'consonant_group'};
const recognition:readonly [string,WrittenSyllableDraft['pattern']][]=[
 ['mo/to','simple'],['la/ma','simple'],['me/nu','simple'],['vé/lo','simple'],['do/mi/no','simple'],['la/va/bo','simple'],['ca/na/pé','simple'],['nu/mé/ro','simple'],
 ['bal/lon','double_consonant'],['pom/me','double_consonant'],['tas/se','double_consonant'],['som/me','double_consonant'],
 ['col/ler','double_consonant'],['bel/le','double_consonant'],['don/ner','double_consonant'],['buf/fet','double_consonant'],
 ['a/bri','consonant_group'],['é/clat','consonant_group'],['pa/tron','consonant_group'],['ré/gla/ge','consonant_group'],
 ['pa/cha','consonant_group'],['ma/chi/ne','consonant_group'],['si/gna/ler','consonant_group'],['di/plô/me','consonant_group'],
];
const production:readonly [string,WrittenSyllableDraft['pattern']][]=[
 ['pa/pa','simple'],['bé/bé','simple'],['ca/fé','simple'],['ju/do','simple'],['sa/la/de','simple'],['to/ma/te','simple'],['ca/ra/va/ne','simple'],['lo/co/mo/ti/ve','simple'],
 ['bal/le','double_consonant'],['nap/pe','double_consonant'],['vil/le','double_consonant'],['gom/me','double_consonant'],
 ['pas/ser','double_consonant'],['dos/sier','double_consonant'],['mes/se','double_consonant'],['pel/le','double_consonant'],
 ['li/vre','consonant_group'],['vi/tri/ne','consonant_group'],['ca/pri/ce','consonant_group'],['é/gli/se','consonant_group'],
 ['é/cha/lo/te','consonant_group'],['cha/grin','consonant_group'],['ti/gre','consonant_group'],['ta/ble','consonant_group'],
];
export const WRITTEN_SYLLABLE_DRAFTS:readonly WrittenSyllableDraft[]=([['recognition',recognition],['production',production]] as const).flatMap(([mode,rows])=>rows.map(([segmented,pattern])=>({key:`${mode}-${segmented.replaceAll('/','')}`,mode,word:segmented.replaceAll('/',''),segmented,pattern})));
/** All placements of a slash, including no slash, for short words. Keeps the
 * guessing estimate honest when there are only a few possible segmentations. */
export function shortWordSegmentations(word:string):string[]|undefined{
 const letters=[...word];if(letters.length>5)return;
 return Array.from({length:2**(letters.length-1)},(_,mask)=>letters.map((letter,index)=>letter+(index<letters.length-1&&(mask&(1<<index))?'/':'')).join(''));
}
