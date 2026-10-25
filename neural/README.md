# AMR Neural Restoration

AMR now has a real neural restoration backend boundary using the upstream **Apollo** music-restoration implementation. Apollo is designed for lossy/compressed music and reconstructs degraded mid/high-frequency content.

## Architecture

`Android/Browser -> AMR UI -> neural/client.js -> HTTP /restore -> compatible PC neural host -> Apollo/PyTorch -> restored WAV -> AMR master/export`

The browser never pretends that local DSP is neural inference.

## Server

From the `neural` directory on a compatible Python/PyTorch machine:

```text
set AMR_APOLLO_DIR=C:\path\to\Apollo
python apollo_server.py
```

Linux/macOS:

```text
export AMR_APOLLO_DIR=/path/to/Apollo
python3 apollo_server.py
```

Health check: `http://127.0.0.1:8765/health`

The server reports `neural_available: true` only when the configured Apollo checkout contains `inference.py`. Apollo's upstream documentation provides pretrained checkpoints and inference usage, including bounded-memory chunking for long audio.

## Compatibility rule

Do **not** blindly install the neural stack on the old Windows 7 32-bit / 2 GB machine. Apollo's documented environment is a modern Python/PyTorch environment. AMR therefore keeps the neural host separate from the lightweight Android/legacy-browser client. A compatible PC/server can run the model while the Redmi 5 Plus handles only UI and transfer.

## Restoration targets

Apollo is specifically relevant to:

- MP3/codec-related high-frequency loss and artifacts
- degraded mid/high-frequency detail
- some metallic/compressed texture caused by lossy encoding

It is not an AI-origin detector and does not guarantee removal of an acoustic fingerprint, watermark, or proprietary matching signature. Metadata erasure and acoustic-signal transformation remain separate operations.

## UI integration contract

`neural/client.js` exposes `AMRNeural.health()` and `AMRNeural.restore()`. The final UI should render a clearly labeled **NEURAL RESTORE** control, show server/model status, send a rendered WAV, receive the neural WAV, and place that result back into the existing AMR master/export pipeline. CLEAN/RESTORE/PRO MASTER remain available as the local fallback.
