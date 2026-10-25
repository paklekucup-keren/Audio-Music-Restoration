# Audio Music Restoration

Standalone local-first browser audio restoration project, separate from AMI.

## Current build
- Local audio import and browser decode
- Signal analysis: peak, RMS, clipping, DC offset
- Working CLEAN / RESTORE DSP processing
- Working PRO MASTER render
- A/B and processed preview
- WAV 16-bit and 24-bit downloads
- Source file is never overwritten
- Metadata/signal inspection UI
- Responsive professional UI for desktop and mobile browsers

## Important scope
The current browser build uses deterministic DSP. It does **not** claim neural restoration, neural stem separation, proprietary acoustic-fingerprint removal, or watermark removal. Those capabilities require a real compatible model/runtime and must be integrated and tested rather than simulated by UI controls.

MP3 128/192/256/320 kbps is intentionally not faked by renaming WAV. A real encoder will be added when bundled and verified.

## Run
Open `index.html` in a modern browser. Processing is local and requires no account, subscription, upload, or credits.

## Planned integration
1. Real MP3 encoder with 128/192/256/320 kbps export.
2. Full metadata parser/eraser and output verification.
3. Neural restoration adapter for shimmer, metallic high-frequency texture, grain/digital texture, artificial vocal texture, codec damage, and missing-detail reconstruction.
4. Neural stem separation/routing where the selected model/runtime is compatible with the target hardware.
5. Lightweight PC neural service with browser client, then Android wrapper/client.
6. Regression tests for Windows 7 32-bit / 2 GB RAM and Android 7.1.2 constraints.
