import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {createWritingEvaluator,writingJudgmentSchema,resolveWritingExcerpt,WritingAssessmentError,type WritingJudge} from "./writing-evaluator";
function fixture(){
 const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
 const item={...bank.items[0].item,nodeKey:"employer_imparfait_en_contexte",promptFr:"Décris les habitudes d’un personnage autrefois."};
 const input={answer:"Il jouait. Il jouait souvent dehors.",skillId:"writing-target",item};
 const judge=vi.fn<WritingJudge>(async()=>({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{excerpt:"jouait",occurrence:1,correct:true,reasonFr:"Une habitude dans le passé."}]}));
 return {input,judge,evaluate:createWritingEvaluator(judge)};
}
it("uses approved target criteria and anchors repeated excerpts to the chosen occurrence",async()=>{
 const f=fixture(),result=await f.evaluate(f.input);
 expect(result.tokens).toEqual([{start:14,end:20,text:"jouait",criterionId:undefined,correct:true,reasonFr:"Une habitude dans le passé."}]);
 expect(f.judge).toHaveBeenCalledWith(expect.objectContaining({target:expect.objectContaining({nodeKey:"employer_imparfait_en_contexte",criteria:expect.objectContaining({unaidedTransferRequired:true})})}));
});
it("treats no target opportunity as unassessable rather than an invented error",async()=>{
 const f=fixture();f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[]});
 expect(await f.evaluate(f.input)).toMatchObject({tokens:[]});
});
it("rejects uncertainty, missing excerpts, overlap and missing revision comparison",async()=>{
 const f=fixture();
 for(const judgment of [
  {uncertain:true,connectedWriting:true,revisionReviewed:false,opportunities:[]},
  {uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{excerpt:"inventé",occurrence:0,correct:true,reasonFr:"Non ancré."}]},
  {uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[0,0].map(occurrence=>({excerpt:"jouait",occurrence,correct:true,reasonFr:"Doublon."}))},
 ]){f.judge.mockResolvedValue(judgment);await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);}
 f.input.item.nodeKey="reviser_orthographe_lexicale_paragraphe";f.judge.mockClear();
 await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);expect(f.judge).not.toHaveBeenCalled();
 f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[]});
 await expect(f.evaluate({...f.input,firstDraft:"Il jouet."})).rejects.toBeInstanceOf(WritingAssessmentError);
});
it("compares both versions and preserves the evaluator's explanation",async()=>{
 const f=fixture();f.input.item.nodeKey="reviser_orthographe_lexicale_paragraphe";
 f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:true,opportunities:[{excerpt:"chevaux",occurrence:0,correct:true,reasonFr:"La graphie incorrecte a été corrigée."}]});
 const result=await f.evaluate({...f.input,answer:"Les chevaux courent.",firstDraft:"Les cheveaux courent."});
 expect(result.revisionReviewed).toBe(true);expect(result.tokens[0].text).toBe("chevaux");
 expect(f.judge).toHaveBeenCalledWith(expect.objectContaining({firstDraft:"Les cheveaux courent."}));
});
it("binds evaluator provenance to the protocol and exact task rubric",async()=>{
 const f=fixture(),first=await f.evaluate(f.input);
 expect(first.evaluator).toMatchObject({version:"french-writing-evaluator-v7",model:"injected-judge",protocolChecksum:expect.stringMatching(/^sha256:/),rubricChecksum:expect.stringMatching(/^sha256:/)});
 const second=await f.evaluate({...f.input,item:{...f.input.item,promptFr:"Décris un lieu dans le passé."}});
 expect(second.evaluator?.rubricChecksum).not.toBe(first.evaluator?.rubricChecksum);
 expect(second.evaluator?.protocolChecksum).toBe(first.evaluator?.protocolChecksum);
});

it("anchors apostrophe variants to exact source and excludes word-internal pronoun matches",()=>{
 expect(resolveWritingExcerpt("Elle m’a remercié puis me l’a rendu.","m'",0)).toEqual({start:5,end:7,text:"m’"});
 const source="Elle m’a remercié puis me l’a rendu.";
 expect(resolveWritingExcerpt(source,"me",0).start).toBe(source.indexOf("me l’"));
 expect(()=>resolveWritingExcerpt("Il parle.","le",0)).toThrow(/unavailable/);
 expect(()=>resolveWritingExcerpt("Il a parlé.","parle",0)).toThrow(/unavailable/);
});
it("accepts the captured live apostrophe failures after source-preserving anchoring",async()=>{
 const regressions=JSON.parse(readFileSync("docs/diagnostic/writing/anchoring-regressions.json","utf8"));
 for(const {source,judgment} of regressions){
  const f=fixture();f.judge.mockResolvedValue(judgment);
  const result=await f.evaluate({...f.input,answer:source.answer,item:{...f.input.item,nodeKey:source.node,promptFr:source.prompt}});
  expect(result.tokens.length).toBeGreaterThan(0);
  for(const token of result.tokens)expect(source.answer.slice(token.start,token.end)).toBe(token.text);
 }
});
it("requires explicit spelling scope and rejects opportunities outside it",async()=>{
 const f=fixture();f.input.item.nodeKey="maintenir_orthographe_lexicale_phrase";
 await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);expect(f.judge).not.toHaveBeenCalled();
 const rubric={version:1,nodeKey:f.input.item.nodeKey,criteria:[{id:"word:cheval",descriptionFr:"Évaluer uniquement la graphie du nom cheval et de son pluriel chevaux."}],exclusionsFr:[]};
 f.input.item.validatorConfig={writingRubric:rubric};f.input.answer="Les chevaux courent.";
 f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{excerpt:"chevaux",occurrence:0,criterionId:"word:cheval",correct:true,reasonFr:"Graphie du pluriel correcte."}]});
 const result=await f.evaluate(f.input);expect(result.tokens[0].criterionId).toBe("word:cheval");
 expect(f.judge).toHaveBeenCalledWith(expect.objectContaining({rubric}));
 f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{excerpt:"courent",occurrence:0,criterionId:"verb:agreement",correct:true,reasonFr:"Hors de la portée."}]});
 await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);
 f.input.item.validatorConfig={writingRubric:{...rubric,nodeKey:"another-target"}};
 await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);
});

it("makes rubric criterion IDs mandatory in the provider schema",()=>{
 const rubric={version:1 as const,nodeKey:"maintenir_orthographe_lexicale_phrase",criteria:[{id:"word:cheval",descriptionFr:"Graphie du nom cheval."}],exclusionsFr:[]};
 const schema=writingJudgmentSchema(rubric);
 const base={uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{excerpt:"cheval",occurrence:0,correct:true,reasonFr:"Graphie correcte."}]};
 expect(schema.safeParse(base).success).toBe(false);
 expect(schema.safeParse({...base,opportunities:[{...base.opportunities[0],criterionId:"word:cheval"}]}).success).toBe(true);
 expect(schema.safeParse({...base,opportunities:[{...base.opportunities[0],criterionId:"unlisted"}]}).success).toBe(false);
});

it("overrules false imperative correctness only with anchored conjugator evidence",async()=>{
 const f=fixture();f.input.item.nodeKey="employer_imperatif_en_contexte";
 f.input.answer="Prend ton sac. Mets tes chaussures.";
 f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[
  {excerpt:"Prend",occurrence:0,correct:true,reasonFr:"Le modèle accepte à tort cette forme.",imperativeForm:{infinitive:"prendre",excerpt:"Prend",occurrence:0}},
  {excerpt:"Mets",occurrence:0,correct:false,reasonFr:"Contexte jugé incorrect.",imperativeForm:{infinitive:"mettre",excerpt:"Mets",occurrence:0}},
 ]});
 const result=await f.evaluate(f.input);
 expect(result.tokens.map(t=>t.correct)).toEqual([false,false]);
 expect(result.tokens[0].reasonFr).toContain('prends, prenons, prenez');
 expect(result.tokens[1].reasonFr).toBe('Contexte jugé incorrect.');
});
it("requires source-bound imperative proof and refuses unknown paradigms",async()=>{
 const f=fixture();f.input.item.nodeKey="employer_imperatif_en_contexte";f.input.answer="Prends ton sac. Appelle Lina.";
 const opportunity={excerpt:"Prends",occurrence:0,correct:true,reasonFr:"Consigne."};
 for(const proof of [undefined,{infinitive:"appeler",excerpt:"Prends",occurrence:0},{infinitive:"prendre",excerpt:"Appelle",occurrence:0}]){
  f.judge.mockResolvedValue({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[{...opportunity,...(proof?{imperativeForm:proof}:{})}]});
  await expect(f.evaluate(f.input)).rejects.toBeInstanceOf(WritingAssessmentError);
 }
 const schema=writingJudgmentSchema(undefined,'employer_imperatif_en_contexte');
 expect(schema.safeParse({uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[opportunity]}).success).toBe(false);
});
