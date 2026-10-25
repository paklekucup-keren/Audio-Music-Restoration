"""AMR neural restoration server.

Runs on the neural host. The browser/Android client sends WAV PCM to /restore
and receives a restored WAV. This server never pretends DSP is neural: if the
Apollo runtime/model is unavailable, /restore returns 503.
"""
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile

from model_adapter import NeuralRestorationAdapter

HOST = "0.0.0.0"
PORT = 8787
ADAPTER = NeuralRestorationAdapter()
MAX_BYTES = 1_500_000_000

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
            self.json(200, {"ok": True, "neural_available": ADAPTER.available(), "model": ADAPTER.info.__dict__})
            return
        self.json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/restore":
            self.json(404, {"error": "not found"}); return
        if not ADAPTER.available():
            self.json(503, {"error": "Apollo neural model is not installed/configured on this server."}); return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 44 or length > MAX_BYTES:
                self.json(413, {"error": "Invalid or oversized WAV request."}); return
            body = self.rfile.read(length)
            with NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(body); src = Path(f.name)
            out = src.with_name(src.stem + "_neural.wav")
            try:
                info = ADAPTER.process(src, out)
                data = out.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(data)))
                self.cors(); self.end_headers(); self.wfile.write(data)
                print("[AMR] restored with", info.name)
            finally:
                src.unlink(missing_ok=True); out.unlink(missing_ok=True)
        except Exception as exc:
            self.json(500, {"error": str(exc)})

if __name__ == "__main__":
    print("Audio Music Restoration neural server")
    print("Listening on http://%s:%s" % (HOST, PORT))
    print("Apollo available:", ADAPTER.available())
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
