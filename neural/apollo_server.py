"""Audio Music Restoration neural/export server.

Neural host only. /restore runs the configured neural restoration engine.
/encode-mp3 performs real MP3 encoding through an FFmpeg binary supplied by
imageio-ffmpeg when installed. No WAV is renamed to .mp3.
"""
from __future__ import annotations
import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile

from model_adapter import NeuralRestorationAdapter

HOST = "0.0.0.0"
PORT = 8787
ADAPTER = NeuralRestorationAdapter()
MAX_BYTES = 1_500_000_000
BITRATES = {128, 192, 256, 320}

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG = None

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("[AMR] " + (fmt % args))

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")

    def json(self, code, payload):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.cors(); self.end_headers(); self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.json(200, {"ok": True, "neural_available": ADAPTER.available(),
                            "mp3_available": bool(FFMPEG), "port": PORT,
                            "model": ADAPTER.info.__dict__})
            return
        self.json(404, {"error": "not found"})

    def body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 44 or length > MAX_BYTES:
            raise ValueError("Invalid or oversized WAV request.")
        return self.rfile.read(length)

    def send_audio(self, data, mime, filename):
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Disposition", 'attachment; filename="%s"' % filename)
        self.send_header("Content-Length", str(len(data)))
        self.cors(); self.end_headers(); self.wfile.write(data)

    def do_POST(self):
        try:
            if self.path == "/restore":
                if not ADAPTER.available():
                    self.json(503, {"error": "Apollo neural model is not installed/configured on this server."}); return
                body = self.body()
                with NamedTemporaryFile(suffix=".wav", delete=False) as f:
                    f.write(body); src = Path(f.name)
                out = src.with_name(src.stem + "_neural.wav")
                try:
                    info = ADAPTER.process(src, out)
                    self.send_audio(out.read_bytes(), "audio/wav", "amr_neural_restored.wav")
                    print("[AMR] restored with", info.name)
                finally:
                    src.unlink(missing_ok=True); out.unlink(missing_ok=True)
                return

            if self.path.startswith("/encode-mp3"):
                if not FFMPEG:
                    self.json(503, {"error": "FFmpeg encoder is unavailable on the neural/export server."}); return
                query = self.path.split("?", 1)[1] if "?" in self.path else ""
                params = dict(x.split("=", 1) for x in query.split("&") if "=" in x)
                bitrate = int(params.get("bitrate", "320"))
                if bitrate not in BITRATES:
                    self.json(400, {"error": "Bitrate must be 128, 192, 256 or 320 kbps."}); return
                body = self.body()
                with NamedTemporaryFile(suffix=".wav", delete=False) as f:
                    f.write(body); src = Path(f.name)
                out = src.with_suffix(".mp3")
                try:
                    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
                           "-codec:a", "libmp3lame", "-b:a", "%dk" % bitrate, str(out)]
                    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    self.send_audio(out.read_bytes(), "audio/mpeg", "amr_restored_%dk.mp3" % bitrate)
                except subprocess.CalledProcessError as exc:
                    self.json(500, {"error": "MP3 encoder failed: " + exc.stderr.decode("utf-8", "replace")[-1000:]})
                finally:
                    src.unlink(missing_ok=True); out.unlink(missing_ok=True)
                return

            self.json(404, {"error": "not found"})
        except Exception as exc:
            self.json(500, {"error": str(exc)})

if __name__ == "__main__":
    print("Audio Music Restoration neural/export server")
    print("Listening on http://%s:%s" % (HOST, PORT))
    print("Apollo available:", ADAPTER.available())
    print("MP3 encoder available:", bool(FFMPEG))
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
