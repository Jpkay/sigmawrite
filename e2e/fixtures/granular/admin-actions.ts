import {startGranularDiagnostic,updateGranularDiagnostic,updateGranularLearningCheck,updateGranularTeaching} from './actions';
const server={command:'fixture',totalMs:24,spans:[{name:'release.load',startMs:2,ms:14},{name:'view',startMs:17,ms:5}]};
export async function startAdminDiagnosticTest(){return {...await startGranularDiagnostic(),token:'fixture-token',releaseKey:'french-granular-diagnostic-v1',server};}
export async function updateAdminDiagnosticTest(input:{kind:'diagnostic'|'learning'|'teaching';command:unknown}){
 const response=await(input.kind==='diagnostic'?updateGranularDiagnostic(input.command):input.kind==='learning'?updateGranularLearningCheck(input.command):updateGranularTeaching(input.command));
 return {...response,token:'fixture-token',server:{...server,command:input.kind}};
}
