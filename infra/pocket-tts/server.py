"""Local French speech backend for dictée and word audio (Kyutai Pocket TTS).

Speaks the slice of the OpenAI speech API the app uses:

    POST /v1/audio/speech  {"input": "...", "voice": "estelle", "speed": 0.85}
    -> 24 kHz mono 16-bit WAV

Runs next to the renderer (GitHub Actions job `dictation-audio.yml`), never on
the public internet. Speed below 1 is applied with ffmpeg's `atempo`, which
slows the voice without changing its pitch.

Pocket TTS is sampled, so a short phrase sometimes comes out garbled ("Il
menait" heard as "Et mener"). Each request is therefore rendered up to
`--takes` times; every take is transcribed by Whisper on the same CPU and the
take whose words are closest to the text wins (stops at the first exact one).
Measured 2026-10-19 on dictée phrases: word error 22 % for one take, 8.6 % for
the best of three, against 14.7 % for macOS "Thomas"; the residue is mostly
homophones Whisper cannot separate ("poêle"/"poil").

    uv run --with pocket-tts==3.3.0 --with faster-whisper==1.2.1 python infra/pocket-tts/server.py --port 8880

Voice: "estelle" (kyutai/tts-voices unmute-prod-website/developpeuse-3.wav, CC0).
"""

from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import subprocess
import threading
import unicodedata
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from pocket_tts import TTSModel

LOCK = threading.Lock()  # generate_audio is not thread-safe
STATES: dict[str, object] = {}


def to_wav(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")
    out = io.BytesIO()
    with wave.open(out, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(pcm.tobytes())
    return out.getvalue()


def words(text: str) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower().replace("’", "'"))
    return re.sub(r"[^\w' -]", " ", text).replace("-", " ").split()


def word_error(reference: list[str], heard: list[str]) -> float:
    """Word-level edit distance over the reference length."""
    if not reference:
        return 0.0
    row = list(range(len(heard) + 1))
    for i, ref in enumerate(reference, 1):
        prev, row[0] = row[0], i
        for j, hyp in enumerate(heard, 1):
            prev, row[j] = row[j], min(row[j] + 1, row[j - 1] + 1, prev + (ref != hyp))
    return row[-1] / len(reference)


def slow_down(samples: np.ndarray, rate: int, speed: float) -> np.ndarray:
    """Pitch-preserving tempo change; raw PCM in and out so no piped WAV header is trusted."""
    if abs(speed - 1.0) < 0.01:
        return samples
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required for speed != 1")
    speed = min(2.0, max(0.5, speed))
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0",
         "-filter:a", f"atempo={speed:.3f}", "-f", "f32le", "-ar", str(rate), "-ac", "1", "pipe:1"],
        input=samples.astype("<f4").tobytes(), capture_output=True, check=True,
    )
    return np.frombuffer(result.stdout, dtype="<f4")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8880)
    parser.add_argument("--language", default="french")
    parser.add_argument("--voice", default="estelle")
    parser.add_argument("--takes", type=int, default=3, help="takes per request, checked by Whisper; 1 disables the check")
    parser.add_argument("--whisper", default="large-v3-turbo")
    args = parser.parse_args()

    model = TTSModel.load_model(language=args.language)
    rate = model.sample_rate
    listener = None
    if args.takes > 1:
        from faster_whisper import WhisperModel

        listener = WhisperModel(args.whisper, device="cpu", compute_type="int8")

    def heard(samples: np.ndarray) -> list[str]:
        # Whisper expects 16 kHz; linear resampling is plenty for a check.
        target = np.interp(np.arange(0, len(samples), rate / 16000), np.arange(len(samples)), samples).astype(np.float32)
        segments, _ = listener.transcribe(target, language="fr", beam_size=1, vad_filter=False, condition_on_previous_text=False)
        return words(" ".join(segment.text for segment in segments))

    def best_take(state, text: str) -> tuple[np.ndarray, float, int]:
        reference = words(text)
        best: tuple[np.ndarray, float] | None = None
        takes = args.takes if listener else 1
        for take in range(1, takes + 1):
            audio = model.generate_audio(state, text).detach().cpu().numpy().reshape(-1).astype(np.float32)
            if not listener:
                return audio, -1.0, take
            error = word_error(reference, heard(audio))
            if best is None or error < best[1]:
                best = (audio, error)
            if error == 0:
                break
        return best[0], best[1], take

    def state_for(voice: str):
        if voice not in STATES:
            STATES[voice] = model.get_state_for_audio_prompt(voice)
        return STATES[voice]

    state_for(args.voice)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def reply(self, status: int, body: bytes, kind: str) -> None:
            self.send_response(status)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path.rstrip("/") in ("/health", "/v1/health"):
                self.reply(200, b'{"ok":true}', "application/json")
            else:
                self.reply(404, b"{}", "application/json")

        def do_POST(self):
            if self.path.rstrip("/") != "/v1/audio/speech":
                self.reply(404, b"{}", "application/json")
                return
            try:
                payload = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
                text = str(payload.get("input", "")).strip()
                if not text:
                    raise ValueError("input is empty")
                voice = str(payload.get("voice") or args.voice)
                if voice in ("alloy", "default"):
                    voice = args.voice
                speed = float(payload.get("speed") or 1.0)
                with LOCK:
                    samples, error, takes = best_take(state_for(voice), text)
                print(json.dumps({"chars": len(text), "takes": takes, "word_error": round(error, 3)}), flush=True)
                self.reply(200, to_wav(slow_down(samples, rate, speed), rate), "audio/wav")
            except Exception as error:  # noqa: BLE001 - the renderer records the message
                self.reply(500, json.dumps({"error": str(error)[:300]}).encode(), "application/json")

    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
