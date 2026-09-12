import type {CanonicalDiagnosticBankItem} from '../item-bank';
export type AudioStimulus={sha256:string;durationMs:number;locale:'fr-FR';format:'mp3'};
/** No transcript, provider input or arbitrary remote URL belongs in this metadata. */
export function readAudioStimulus(item:CanonicalDiagnosticBankItem['item']):AudioStimulus|undefined{
 return parseAudioStimulus(item.validatorConfig?.audioStimulus);
}
export function parseAudioStimulus(raw:unknown):AudioStimulus|undefined{
 if(raw===undefined)return;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid diagnostic audio stimulus');
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).some(k=>!['sha256','durationMs','locale','format'].includes(k))||typeof value.sha256!=='string'||!/^sha256:[a-f0-9]{64}$/.test(value.sha256)||value.locale!=='fr-FR'||value.format!=='mp3'||typeof value.durationMs!=='number'||!Number.isInteger(value.durationMs)||value.durationMs<100||value.durationMs>60000)throw Error('Invalid diagnostic audio stimulus');
 return {sha256:value.sha256,durationMs:value.durationMs,locale:value.locale,format:value.format};
}
export function audioStimulusPath(audio:AudioStimulus){return `/diagnostic-audio/${audio.sha256.slice(7)}.mp3`;}
export function publicAudioQuestionFields(item:CanonicalDiagnosticBankItem['item']){
 return publicAudioFields(item.validatorConfig?.audioStimulus);
}
export function publicAudioFields(raw:unknown){
 const audio=parseAudioStimulus(raw);
 return audio?{audio:{src:audioStimulusPath(audio),mimeType:'audio/mpeg' as const}}:{};
}
