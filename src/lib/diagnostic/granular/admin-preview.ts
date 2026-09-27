import 'server-only';
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import type {AssessmentStore,AssessmentBundle,StoredSession} from './service';
import type {AssessmentSession} from './session';

const lifetimeMs=2*60*60*1000;
const maxTokenLength=300_000;
export type PreviewState={ownerId:string;expiresAt:number;session:StoredSession};
function key(){
 const secret=process.env.DIAGNOSTIC_TEST_SIGNING_SECRET??process.env.CRON_SECRET??process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||secret.length<32)throw Error('Diagnostic test signing secret is unavailable');
 return createHmac('sha256',secret).update('granular-admin-preview-v1').digest();
}
function signature(payload:string){return createHmac('sha256',key()).update(payload).digest();}
export function signPreviewState(state:PreviewState){
 const payload=Buffer.from(JSON.stringify(state)).toString('base64url');
 return `${payload}.${signature(payload).toString('base64url')}`;
}
export function verifyPreviewState(token:unknown,ownerId:string,now=Date.now()):PreviewState{
 if(typeof token!=='string'||token.length>maxTokenLength)throw Error('Session de test invalide. Recommencez le test.');
 const [payload,mac,...rest]=token.split('.');
 if(!payload||!mac||rest.length)throw Error('Session de test invalide. Recommencez le test.');
 const expected=signature(payload),actual=Buffer.from(mac,'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('Session de test invalide. Recommencez le test.');
 let value:PreviewState;
 try{value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as PreviewState;}catch{throw Error('Session de test invalide. Recommencez le test.');}
 if(value.ownerId!==ownerId||!Number.isFinite(value.expiresAt)||value.expiresAt<=now||value.expiresAt>now+lifetimeMs||!value.session||value.session.studentId!==ownerId||typeof value.session.id!=='string'||typeof value.session.releaseId!=='string'||!value.session.state||!Number.isInteger(value.session.state.revision))throw Error('Session de test expirée ou invalide. Recommencez le test.');
 return value;
}
export function newPreviewState(ownerId:string,releaseId:string,state:AssessmentSession,now=Date.now()):PreviewState{
 return {ownerId,expiresAt:now+lifetimeMs,session:{id:randomUUID(),studentId:ownerId,releaseId,state}};
}
/** This adapter only mutates its request-local copy. The published release is read from the database. */
export class PreviewAssessmentStore implements AssessmentStore{
 constructor(private readonly current:StoredSession,private readonly readRelease:(id:string)=>Promise<AssessmentBundle|null>){}
 async load(studentId:string,sessionId:string){return studentId===this.current.studentId&&sessionId===this.current.id?this.current:null;}
 async release(id:string){return this.readRelease(id);}
 async save(studentId:string,sessionId:string,expectedRevision:number,state:AssessmentSession){
  if(studentId!==this.current.studentId||sessionId!==this.current.id||expectedRevision!==this.current.state.revision)return false;
  this.current.state=state;return true;
 }
}
