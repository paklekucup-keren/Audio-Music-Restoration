# AMR Neural Restoration — Run Guide

## 1. Install the neural backend

This project uses the real Apollo music-restoration model as the first neural backend. Apollo is designed for restoration of lossy-compressed music and specifically targets codec-related degradation in mid/high frequencies.

Official project: https://github.com/JusperLee/Apollo
Official model: https://huggingface.co/JusperLee/Apollo

The Apollo repository documents its own environment and inference command. Keep the Apollo checkout beside this AMR `neural/` directory or point the adapter to it.

## 2. Start AMR neural server

From `neural/`:

    python apollo_server.py

Default endpoint:

    http://127.0.0.1:8765

The server reports whether the Apollo adapter is actually available. If it is not installed, `/restore` returns an error instead of silently falling back to DSP.

## 3. Browser client

Open `neural/index.html` in the browser. Enter the PC address. On the same PC use `http://127.0.0.1:8765`; from an Android phone on the same Wi-Fi, use the PC's LAN address, for example `http://192.168.1.20:8765`.

Press **CHECK SERVER**. Only when the server reports the neural model as available does **NEURAL RESTORE** become usable.

## 4. Important compatibility reality

The neural server is intentionally separated from the Android client. A Redmi 5 Plus should not be expected to run the PyTorch model locally. The PC/server must have a compatible 64-bit Python/PyTorch environment. Current PyTorch documentation says PyTorch does not work on 32-bit systems; therefore the user's Windows 7 32-bit machine cannot be the Apollo inference host without changing the host platform. Windows 7 is also a legacy compatibility target, so a modern compatible 64-bit machine is the practical neural host.

## 5. Output

The neural endpoint returns WAV/PCM. AMR's master/export stage can process that result. MP3 128/192/256/320 kbps must use a real MP3 encoder; do not rename WAV files to `.mp3`.

## 6. Scope

Apollo is a restoration model, not a guaranteed AI-origin detector or proprietary acoustic-fingerprint remover. Metadata stripping and acoustic fingerprinting remain separate functions. No component should claim guaranteed identity evasion or watermark removal.
