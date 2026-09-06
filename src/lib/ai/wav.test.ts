import { describe, expect, it } from "vitest";
import { encodeWav, parseWav, silence, wavDurationSeconds } from "./wav";

describe("wav helpers", () => {
  it("round-trips PCM and splices exact silence", () => {
    const tone = { sampleRate: 24000, samples: Int16Array.from({ length: 2400 }, (_, i) => Math.round(Math.sin(i / 10) * 10000)) };
    const bytes = encodeWav([tone, silence(24000, 0.5), tone]);
    expect(wavDurationSeconds(bytes)).toBeCloseTo(0.1 + 0.5 + 0.1, 3);
    const parsed = parseWav(bytes);
    expect(parsed.sampleRate).toBe(24000);
    expect(parsed.samples[100]).toBe(tone.samples[100]);
    expect(parsed.samples[2400 + 6000]).toBe(0);
  });
});
