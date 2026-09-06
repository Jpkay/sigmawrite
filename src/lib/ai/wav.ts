/** Minimal PCM WAV helpers for splicing speech chunks with exact silences (mono, 16-bit). */

export type PcmChunk = { sampleRate: number; samples: Int16Array };

export function parseWav(bytes: Uint8Array): PcmChunk {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== "RIFF" || String.fromCharCode(...bytes.subarray(8, 12)) !== "WAVE") throw new Error("Not a WAV file");
  let offset = 12; let sampleRate = 0; let channels = 1; let bits = 16; let data: Uint8Array | null = null;
  while (offset + 8 <= bytes.byteLength) {
    const id = String.fromCharCode(...bytes.subarray(offset, offset + 4)); const size = view.getUint32(offset + 4, true);
    if (id === "fmt ") { channels = view.getUint16(offset + 10, true); sampleRate = view.getUint32(offset + 12, true); bits = view.getUint16(offset + 22, true); }
    if (id === "data") { data = bytes.subarray(offset + 8, offset + 8 + size); break; }
    offset += 8 + size + (size % 2);
  }
  if (!data || !sampleRate) throw new Error("WAV without data");
  if (bits !== 16) throw new Error(`Unsupported WAV bit depth ${bits}`);
  const frames = Math.floor(data.byteLength / 2 / channels);
  const samples = new Int16Array(frames);
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let i = 0; i < frames; i++) samples[i] = dv.getInt16(i * 2 * channels, true);
  return { sampleRate, samples };
}

export function silence(sampleRate: number, seconds: number): PcmChunk {
  return { sampleRate, samples: new Int16Array(Math.max(0, Math.round(sampleRate * seconds))) };
}

/** Concatenate chunks (all at the first chunk's rate) into one WAV file. */
export function encodeWav(chunks: PcmChunk[]): Uint8Array {
  const sampleRate = chunks[0]?.sampleRate ?? 24000;
  for (const chunk of chunks) if (chunk.sampleRate !== sampleRate) throw new Error("Mixed sample rates");
  const total = chunks.reduce((n, chunk) => n + chunk.samples.length, 0);
  const out = new Uint8Array(44 + total * 2); const view = new DataView(out.buffer);
  const ascii = (at: number, text: string) => { for (let i = 0; i < text.length; i++) out[at + i] = text.charCodeAt(i); };
  ascii(0, "RIFF"); view.setUint32(4, 36 + total * 2, true); ascii(8, "WAVE"); ascii(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, "data"); view.setUint32(40, total * 2, true);
  let at = 44;
  for (const chunk of chunks) for (let i = 0; i < chunk.samples.length; i++) { view.setInt16(at, chunk.samples[i], true); at += 2; }
  return out;
}

export function wavDurationSeconds(bytes: Uint8Array): number { const chunk = parseWav(bytes); return chunk.samples.length / chunk.sampleRate; }
