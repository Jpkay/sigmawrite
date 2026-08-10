export type QueuedAnswer={sessionId:string;textKey:string;questionKey:string;choiceIndex?:number;answerText?:string;nextPhase?:"questions"|"summary"};const KEY="plume.offline.answers",LEGACY_KEY="sigmawrite.offline.answers";
export function queueAnswer(answer:QueuedAnswer){const rows=readQueue();const key=`${answer.sessionId}:${answer.questionKey}`;localStorage.setItem(KEY,JSON.stringify([...rows.filter(row=>`${row.sessionId}:${row.questionKey}`!==key),answer]));}
export function readQueue():QueuedAnswer[]{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem(KEY)??localStorage.getItem(LEGACY_KEY)??"[]") as QueuedAnswer[];}catch{return[];}}
export async function flushQueue(send:(answer:QueuedAnswer)=>Promise<unknown>){const rows=readQueue();const failed:QueuedAnswer[]=[];for(const row of rows){try{await send(row);}catch{failed.push(row);}}localStorage.setItem(KEY,JSON.stringify(failed));localStorage.removeItem(LEGACY_KEY);return{sent:rows.length-failed.length,remaining:failed.length};}

export function clearOfflineQueue(){if(typeof window!=="undefined"){localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY);}}
