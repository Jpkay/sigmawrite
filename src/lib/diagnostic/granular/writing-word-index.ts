/** Exact source positions only; no spelling repair, lemmatization or grading. */
export function writingWordIndex(source:string){
 return [...source.matchAll(/[\p{L}\p{M}\p{N}]+/gu)].map((match,id)=>({id,text:match[0],start:match.index,end:match.index+match[0].length}));
}
function excerptAt(source:string,startWord:unknown,endWord:unknown){
 const words=writingWordIndex(source);
 if(!Number.isInteger(startWord)||!Number.isInteger(endWord)||Number(startWord)<0||Number(endWord)<Number(startWord)||Number(endWord)>=words.length)throw Error('Invalid writing word range');
 const start=words[Number(startWord)].start,end=words[Number(endWord)].end;
 const excerpt=source.slice(start,end),canonical=(s:string)=>s.replace(/[’‘]/g,"'");
 const normalized=canonical(source),needle=canonical(excerpt),word=/[\p{L}\p{M}\p{N}]/u;
 let from=0,occurrence=0;
 while(from<=normalized.length){
  const position=normalized.indexOf(needle,from);if(position<0||position>start)break;
  const insideStart=position>0&&word.test(normalized[position-1]);
  const insideEnd=word.test(normalized[position+needle.length]??'');
  if(!insideStart&&!insideEnd){if(position===start)return {excerpt,occurrence};occurrence++;}
  from=position+Math.max(1,needle.length);
 }
 // Legacy excerpt ordinals count non-overlapping occurrences. Never silently
 // relocate a selected overlapping phrase to a different source position.
 throw Error('Invalid writing word range: overlapping excerpt ordinal');
}
/** Convert only explicitly indexed spans; canonical validation still checks
 * every resulting judgment, nested proof and overlap before recording evidence. */
export function resolveIndexedWritingJudgment(raw:unknown,answer:string,firstDraft?:string):unknown {
 function visit(value:unknown,source:string):unknown {
  if(Array.isArray(value))return value.map(v=>visit(v,source));
  if(!value||typeof value!=='object')return value;
  const row=value as Record<string,unknown>;
  if('excerpt' in row||'occurrence' in row)throw Error('Unindexed writing quotation');
  const indexed='startWord' in row||'endWord' in row;
  const result:Record<string,unknown>={};
  for(const [key,child] of Object.entries(row)){
   if(key==='startWord'||key==='endWord')continue;
   if(key==='before'&&child!==null&&firstDraft===undefined)throw Error('Missing writing first draft');
   result[key]=visit(child,key==='before'?firstDraft??'':source);
  }
  return indexed?{...result,...excerptAt(source,row.startWord,row.endWord)}:result;
 }
 return visit(raw,answer);
}
/** Preserve the strict contract while replacing free quotations by word IDs. */
export function indexedWritingSchema(schema:unknown):unknown {
 if(Array.isArray(schema))return schema.map(indexedWritingSchema);
 if(!schema||typeof schema!=='object')return schema;
 const row=Object.fromEntries(Object.entries(schema).map(([key,value])=>[key,indexedWritingSchema(value)])) as Record<string,unknown>;
 const properties=row.properties as Record<string,unknown>|undefined;
 if(properties&&'excerpt' in properties&&'occurrence' in properties){
  delete properties.excerpt;delete properties.occurrence;
  properties.startWord={type:'integer',minimum:0,description:'Identifiant du premier mot dans answerWords (ou firstDraftWords pour before).'};
  properties.endWord={type:'integer',minimum:0,description:'Identifiant du dernier mot inclus, au moins égal à startWord.'};
  row.required=(row.required as string[]).filter(key=>key!=='excerpt'&&key!=='occurrence').concat(['startWord','endWord']);
 }
 return row;
}
