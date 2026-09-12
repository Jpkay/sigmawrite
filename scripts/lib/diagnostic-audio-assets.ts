import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readAudioStimulus,audioStimulusPath} from '../../src/lib/diagnostic/granular/audio-stimulus';
import type {CanonicalDiagnosticBankArtifact} from '../../src/lib/diagnostic/item-bank';
/** Exact-byte check for deployment assets. Duration/pronunciation need separate audio QA. */
export function assertDiagnosticAudioAssets(bank:CanonicalDiagnosticBankArtifact,publicDirectory=resolve('public')){
 const checked=new Set<string>();
 for(const entry of bank.items){
  const audio=readAudioStimulus(entry.item);if(!audio||checked.has(audio.sha256))continue;
  const path=resolve(publicDirectory,`.${audioStimulusPath(audio)}`);
  const bytes=readFileSync(path);
  if(bytes.length<100||`sha256:${createHash('sha256').update(bytes).digest('hex')}`!==audio.sha256)throw Error(`Diagnostic audio asset mismatch: ${entry.itemKey}`);
  checked.add(audio.sha256);
 }
 return {verifiedAudioAssets:checked.size};
}
