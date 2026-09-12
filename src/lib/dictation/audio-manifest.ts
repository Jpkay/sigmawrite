import {createHash} from 'node:crypto';
import {z} from 'zod';
import {checksum} from '@/lib/taxonomy/validate';
import type {SpeechPart,SpeechResult} from '@/lib/ai/provider';

const digest=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const part=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('text'),text:z.string().min(1)}).strict(),
 z.object({kind:z.literal('phonemes'),phonemes:z.string().min(1),text:z.string().min(1)}).strict(),
 z.object({kind:z.literal('silence'),seconds:z.number().finite().nonnegative()}).strict(),
]);
const assetSchema=z.object({
 role:z.enum(['segment','full']),index:z.number().int().nonnegative(),sourceText:z.string().min(1),
 speechPlan:z.array(part).min(1),speed:z.number().finite().positive(),
 byteChecksum:digest,byteLength:z.number().int().positive(),mimeType:z.enum(['audio/mpeg','audio/wav','audio/mp4','audio/ogg']),
 path:z.string(),provider:z.string().min(1),model:z.string().min(1),voice:z.string().min(1),
}).strict();
const schema=z.object({version:z.literal('dictation-audio-manifest-v1'),dictationId:z.string().uuid(),assets:z.array(assetSchema).min(2),checksum:digest}).strict();
export type DictationAudioAsset=z.infer<typeof assetSchema>;
export type DictationAudioManifest=z.infer<typeof schema>;
const byteDigest=(bytes:Uint8Array)=>`sha256:${createHash('sha256').update(bytes).digest('hex')}`;
function assetPath(value:Pick<DictationAudioAsset,'byteChecksum'|'mimeType'>){
 const extension={'audio/mpeg':'mp3','audio/wav':'wav','audio/mp4':'m4a','audio/ogg':'ogg'}[value.mimeType];
 return `immutable/${value.byteChecksum.slice(7)}.${extension}`;
}
/** Renderer provenance binds intended speech input to returned bytes. It does
 * not certify pronunciation, human review, delivery or completed playback. */
export function describeDictationAudio(input:{role:'segment'|'full';index:number;sourceText:string;speechPlan:SpeechPart[];speed:number;speech:SpeechResult}):DictationAudioAsset{
 const {speech,...source}=input;
 const value=assetSchema.parse({...source,byteChecksum:byteDigest(speech.audio),byteLength:speech.audio.byteLength,mimeType:speech.mimeType,path:'pending',provider:speech.provider,model:speech.model,voice:speech.voice});
 return {...value,path:assetPath(value)};
}
export function buildDictationAudioManifest(dictationId:string,assets:DictationAudioAsset[],sourceSegments:readonly string[]):DictationAudioManifest{
 const content={version:'dictation-audio-manifest-v1' as const,dictationId,assets};
 return validateDictationAudioManifest({...content,checksum:checksum(content)},dictationId,sourceSegments);
}
/** Require the exact row identity and ordered source, not only a plausible URL.
 * Only server-owned renderer records may be supplied to this function. */
export function validateDictationAudioManifest(raw:unknown,dictationId:string,sourceSegments:readonly string[]):DictationAudioManifest{
 const parsed=schema.parse(raw),{checksum:recorded,...content}=parsed;
 if(parsed.dictationId!==dictationId||checksum(content)!==recorded)throw Error('Dictation audio manifest changed');
 if(!sourceSegments.length||parsed.assets.length!==sourceSegments.length+1)throw Error('Incomplete dictation audio manifest');
 for(let i=0;i<sourceSegments.length;i++){
  const asset=parsed.assets[i];
  if(asset.role!=='segment'||asset.index!==i||asset.sourceText!==sourceSegments[i])throw Error('Dictation audio source changed');
 }
 const full=parsed.assets.at(-1)!;
 if(full.role!=='full'||full.index!==0||full.sourceText!==sourceSegments.map(s=>s.trim()).join(' '))throw Error('Dictation full audio source changed');
 for(const asset of parsed.assets)if(asset.path!==assetPath(asset))throw Error('Dictation audio path is not immutable');
 return parsed;
}
export function verifyDictationAudioBytes(asset:DictationAudioAsset,bytes:Uint8Array){
 if(asset.path!==assetPath(asset))throw Error('Dictation audio path is not immutable');
 if(asset.byteLength!==bytes.byteLength||asset.byteChecksum!==byteDigest(bytes))throw Error('Dictation audio bytes changed');
}
