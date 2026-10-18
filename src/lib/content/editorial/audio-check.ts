import type { AIProvider, SpeechResult } from "@/lib/ai/provider";
import { buildSpeechPlan, speakableSegment } from "@/lib/dictation/speech-text";

/**
 * TTS round-trip check for dictées (roadmap H.18): render each segment, have
 * speech-to-text transcribe it back, compare with the text. A failing render
 * is retried once with another voice and a slower speed; failing twice means
 * the dictée is not published.
 *
 * STT is optional: enable with EDITORIAL_STT_ENABLED=true plus STT_API_KEY
 * (or OPENAI_API_KEY), STT_BASE_URL (default https://api.openai.com/v1) and
 * STT_MODEL (default gpt-4o-mini-transcribe). Without it the check reports
 * "skipped" and library mode keeps the dictée only if the read-aloud review passed.
 */

export interface SpeechToText {
  readonly model: string;
  transcribe(audio: Uint8Array, mimeType: string): Promise<string>;
}

export class OpenAICompatibleSpeechToText implements SpeechToText {
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  constructor(env: Record<string, string | undefined> = process.env, private readonly fetchImpl: typeof fetch = fetch) {
    this.apiKey = env.STT_API_KEY ?? env.OPENAI_API_KEY ?? "";
    this.baseUrl = (env.STT_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/u, "");
    this.model = env.STT_MODEL ?? "gpt-4o-mini-transcribe";
    if (!this.apiKey) throw new Error("stt_unconfigured");
  }
  async transcribe(audio: Uint8Array, mimeType: string): Promise<string> {
    const form = new FormData();
    const extension = mimeType.includes("wav") ? "wav" : "mp3";
    form.append("file", new Blob([audio.slice().buffer as ArrayBuffer], { type: mimeType }), `segment.${extension}`);
    form.append("model", this.model);
    form.append("language", "fr");
    const response = await this.fetchImpl(`${this.baseUrl}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}` }, body: form });
    if (!response.ok) throw new Error(`stt_http_${response.status}`);
    const json = (await response.json()) as { text?: string };
    return json.text ?? "";
  }
}

export function speechToTextFromEnv(env: Record<string, string | undefined> = process.env): SpeechToText | null {
  if (env.EDITORIAL_STT_ENABLED !== "true") return null;
  try { return new OpenAICompatibleSpeechToText(env); } catch { return null; }
}

const SPOKEN_PUNCTUATION = /\b(?:point final|points de suspension|point d['’]interrogation|point d['’]exclamation|point-virgule|deux-points|ouvrez les guillemets|fermez les guillemets|ouvrez la parenthèse|fermez la parenthèse|virgule|point|tiret|à la ligne)\b/giu;

export function normalizeForComparison(text: string): string[] {
  return text.normalize("NFC").toLocaleLowerCase("fr").replace(/’/gu, "'").replace(SPOKEN_PUNCTUATION, " ")
    .replace(/[^\p{L}\p{N}' -]/gu, " ").split(/[\s-]+/u).map((w) => w.replace(/^'+|'+$/gu, "")).filter(Boolean);
}

/** Word error rate (Levenshtein on words), 0 = identical. */
export function wordErrorRate(expected: string[], actual: string[]): number {
  if (expected.length === 0) return actual.length ? 1 : 0;
  const row = Array.from({ length: actual.length + 1 }, (_, j) => j);
  for (let i = 1; i <= expected.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= actual.length; j += 1) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (expected[i - 1] === actual[j - 1] ? 0 : 1));
      previous = temp;
    }
  }
  return row[actual.length] / expected.length;
}

export type SegmentAudioReport = { index: number; expected: string; transcript: string; wer: number; passed: boolean };
export type AudioCheckReport = { status: "passed" | "failed" | "skipped"; voice: string | null; speed: number | null; attempts: Array<{ voice: string; speed: number; segments: SegmentAudioReport[] }>; reason?: string };

export const AUDIO_CHECK_MAX_WER = 0.15;

export async function verifyDictationAudio(
  segments: string[],
  provider: Pick<AIProvider, "synthesizeSpeechPlan">,
  stt: SpeechToText | null,
  voices: Array<{ voice?: string; speed: number }> = [{ speed: 0.85 }, { voice: process.env.EDITORIAL_TTS_ALT_VOICE, speed: 0.75 }],
): Promise<AudioCheckReport> {
  if (!stt) return { status: "skipped", voice: null, speed: null, attempts: [], reason: "stt_disabled" };
  const attempts: AudioCheckReport["attempts"] = [];
  for (const setting of voices) {
    const reports: SegmentAudioReport[] = [];
    let voiceName = setting.voice ?? "default";
    try {
      for (let index = 0; index < segments.length; index += 1) {
        const spoken = speakableSegment(segments[index], { final: index === segments.length - 1 });
        const speech: SpeechResult = await provider.synthesizeSpeechPlan(buildSpeechPlan(spoken), { voice: setting.voice, speed: setting.speed });
        voiceName = speech.voice;
        const transcript = await stt.transcribe(speech.audio, speech.mimeType);
        const wer = wordErrorRate(normalizeForComparison(segments[index]), normalizeForComparison(transcript));
        reports.push({ index, expected: segments[index], transcript, wer: Number(wer.toFixed(3)), passed: wer <= AUDIO_CHECK_MAX_WER });
      }
    } catch (error) {
      attempts.push({ voice: voiceName, speed: setting.speed, segments: reports });
      return { status: "failed", voice: null, speed: null, attempts, reason: error instanceof Error ? error.message : "audio_error" };
    }
    attempts.push({ voice: voiceName, speed: setting.speed, segments: reports });
    if (reports.every((r) => r.passed)) return { status: "passed", voice: voiceName, speed: setting.speed, attempts };
  }
  return { status: "failed", voice: null, speed: null, attempts, reason: "transcript_mismatch" };
}
