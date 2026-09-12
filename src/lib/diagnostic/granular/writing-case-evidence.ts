/** Hidden synthetic-test expectations. Never send these to the writing judge.
 * Matching the final verdict alone does not establish opportunity-level accuracy. */
export type ExpectedWritingOpportunity={text:string;occurrence?:number;correct:boolean;criterionId?:string};
export function writingCaseEvidenceMatches(answer:string,tokens:readonly {start:number;end:number;correct:boolean;criterionId?:string}[],expected:readonly ExpectedWritingOpportunity[]):boolean {
  if(tokens.length!==expected.length)return false;
  if(tokens.some(t=>!Number.isInteger(t.start)||!Number.isInteger(t.end)||t.start<0||t.end<=t.start||t.end>answer.length))return false;
  const used=new Set<number>();
  for(const target of expected){
    let start=-1,from=0;
    if(!target.text||!Number.isInteger(target.occurrence??0)||(target.occurrence??0)<0)throw Error('Invalid writing case anchor');
    for(let n=0;n<=(target.occurrence??0);n++){
      start=answer.indexOf(target.text,from);if(start<0)throw Error('Writing case anchor absent from response');
      from=start+target.text.length;
    }
    const end=start+target.text.length;
    const matches=tokens.map((token,index)=>({token,index})).filter(({token})=>token.start<=start&&token.end>=end&&token.correct===target.correct&&(!target.criterionId||token.criterionId===target.criterionId));
    if(matches.length!==1||used.has(matches[0].index))return false;
    used.add(matches[0].index);
  }
  return used.size===tokens.length;
}
