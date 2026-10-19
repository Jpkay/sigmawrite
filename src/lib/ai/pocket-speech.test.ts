import { describe, expect, it, vi } from "vitest";
import { buildSpeechPlan, speakableSegment } from "@/lib/dictation/speech-text";
import { MockAIProvider } from "./mock";
import { OpenAICompatibleAIProvider, pocketPhrases } from "./openai-compatible-provider";
import { resolveAIRuntimeConfig } from "./runtime-config";
import { encodeWav, parseWav, silence } from "./wav";

const POCKET_ENV = { AI_PROVIDER: "mock", TTS_BASE_URL: "http://127.0.0.1:8880/v1", TTS_API_KEY: "local", TTS_MODEL: "pocket-tts", TTS_VOICE: "estelle" };
const wav = (seconds: number) => encodeWav([silence(24000, seconds)]);
const okWav = (seconds = 0.5) => new Response(Buffer.from(wav(seconds)), { status: 200, headers: { "Content-Type": "audio/wav" } });

describe("Pocket TTS phrases", () => {
  it("closes each phrase with its punctuation word and keeps the silence after it", () => {
    const plan = buildSpeechPlan(speakableSegment("Au fond de la boutique, les horloges battaient.", { final: false }));
    const phrases = pocketPhrases(plan).map((part) => (part.kind === "silence" ? part.seconds : part.kind === "text" ? part.text : "?"));
    expect(phrases).toEqual(["Au fond de la boutique, virgule.", 0.3, "les horloges battaient, point.", 0.3]);
  });
  it("speaks an opening mark as its own phrase and ends the dictée with the closing sentence", () => {
    const plan = buildSpeechPlan(speakableSegment("« Vous cherchez ? » demanda-t-il.", { final: true }));
    const texts = pocketPhrases(plan).flatMap((part) => (part.kind === "text" ? [part.text] : []));
    expect(texts).toEqual(["Ouvrez les guillemets.", "Vous cherchez, point d’interrogation.", "Fermez les guillemets.", "demanda-t-il, point.", "Point final. La dictée est terminée."]);
    expect(pocketPhrases(plan).some((part) => part.kind === "phonemes")).toBe(false);
  });
  it("never leaves a punctuation word alone after a closing mark", () => {
    const plan = buildSpeechPlan(speakableSegment("« Pas de bruit », murmura-t-il.", { final: false }));
    const texts = pocketPhrases(plan).flatMap((part) => (part.kind === "text" ? [part.text] : []));
    expect(texts).toEqual(["Ouvrez les guillemets.", "Pas de bruit, fermez les guillemets, virgule.", "murmura-t-il, point."]);
  });
});

describe("Pocket TTS backend", () => {
  it("renders a dictée plan as WAV phrases with exact silences and names the voice in provenance", async () => {
    const fetchImpl = vi.fn(async () => okWav());
    const provider = new OpenAICompatibleAIProvider(resolveAIRuntimeConfig(POCKET_ENV), fetchImpl as unknown as typeof fetch);
    const plan = buildSpeechPlan(speakableSegment("Il hésita, puis recula.", { final: false }));
    const result = await provider.synthesizeSpeechPlan(plan, { speed: 0.85 });
    const bodies = fetchImpl.mock.calls.map((call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)));
    expect(bodies.map((body) => body.input)).toEqual(["Il hésita, virgule.", "puis recula, point."]);
    expect(bodies.every((body) => body.response_format === "wav" && body.speed === 0.85 && body.voice === "estelle" && !("lang_code" in body))).toBe(true);
    expect(fetchImpl.mock.calls.every((call) => String((call as unknown as [string])[0]).endsWith("/v1/audio/speech"))).toBe(true);
    expect(result).toMatchObject({ mimeType: "audio/wav", provider: "kyutai-pocket-tts", model: "pocket-tts", voice: "estelle" });
    const audio = parseWav(result.audio);
    expect(audio.samples.length / audio.sampleRate).toBeCloseTo(0.5 + 0.3 + 0.5 + 0.3, 2);
  });
  it("asks for WAV on a single text and labels it as WAV", async () => {
    const fetchImpl = vi.fn(async () => okWav());
    const provider = new OpenAICompatibleAIProvider(resolveAIRuntimeConfig(POCKET_ENV), fetchImpl as unknown as typeof fetch);
    const result = await provider.synthesizeSpeech({ text: "intrépide.", speed: 0.85 });
    expect(JSON.parse(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body)).response_format).toBe("wav");
    expect(result.mimeType).toBe("audio/wav");
  });
  it("the default provider uses a configured voice and still fails closed without one", async () => {
    const saved = { ...process.env };
    try {
      for (const key of ["TTS_BASE_URL", "TTS_API_KEY", "TTS_MODEL", "TTS_VOICE"]) delete process.env[key];
      process.env.AI_PROVIDER = "mock";
      await expect(new MockAIProvider().synthesizeSpeech({ text: "Bonjour." })).rejects.toThrow(/TTS_API_KEY/u);
      Object.assign(process.env, POCKET_ENV);
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => okWav());
      const result = await new MockAIProvider().synthesizeSpeech({ text: "Bonjour." });
      expect(result.provider).toBe("kyutai-pocket-tts");
      expect(String(fetchSpy.mock.calls[0][0])).toBe("http://127.0.0.1:8880/v1/audio/speech");
      fetchSpy.mockRestore();
    } finally {
      process.env = saved;
    }
  });
});
