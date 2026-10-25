from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile
from model_adapter import NeuralRestorationAdapter

HOST = "127.0.0.1"
PORT = 8765
ADAPTER = NeuralRestorationAdapter()

class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, payload: dict):
        raw = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True, "neural_available": ADAPTER.available(), "model": ADAPTER.info.__dict__})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/restore":
            self._send(404, {"error": "not found"})
            return
        if not ADAPTER.available():
            self._send(503, {"error": "Neural model is not installed/configured."})
            return
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        with NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(body)
            src = Path(f.name)
        out = src.with_name(src.stem + "_neural.wav")
        try:
            info = ADAPTER.process(src, out)
            data = out.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        finally:
            src.unlink(missing_ok=True)
            out.unlink(missing_ok=True)

if __name__ == "__main__":
    print(f"Audio Music Restoration neural server: http://{HOST}:{PORT}")
    print("Neural model available:", ADAPTER.available())
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
