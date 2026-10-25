# Neural Restoration Engine

## Engine selected for the first real neural milestone

The first neural restoration backend is **Apollo**, the open research implementation from Tsinghua University / Tencent AI Lab. Apollo is specifically designed for high-quality restoration of compressed music and targets degradation concentrated in mid/high frequencies. Its upstream inference supports CPU/GPU selection and bounded-memory chunk inference. Source: https://github.com/JusperLee/Apollo

This is materially different from the browser DSP layer: the browser filters remain useful for conservative cleanup, while Apollo is an actual learned restoration model.

## Runtime boundary

```text
Android / Windows browser
        |
        | HTTP localhost / LAN
        v
AMR neural server :8765
        |
        v
ApolloEngine adapter
        |
        v
Upstream Apollo inference.py
        |
        v
Apollo checkpoint
        |
        v
restored WAV
```

## Important compatibility decision

The current target PC is Windows 7 32-bit with 2 GB RAM. The upstream Apollo stack is not a realistic native target for that machine: its current documented environment uses modern Python/PyTorch and its normal installation is not a 32-bit Windows deployment. Therefore this repository does **not** pretend that Apollo can run on the old PC merely because the UI can open there.

The application is designed so the browser UI can remain lightweight on the Redmi 5 Plus / legacy Windows browser while the neural server runs on a compatible machine on the same network. If a tested 32-bit-compatible neural runtime/model becomes available, it can be plugged into the same adapter boundary without redesigning the UI.

## Install upstream Apollo

Clone the upstream Apollo repository into:

`third_party/Apollo`

or set:

`AMR_APOLLO_DIR=C:\path\to\Apollo`

The adapter expects `inference.py` in that directory.

Apollo's official inference command is equivalent to:

`python inference.py --in_wav=input.wav --out_wav=restored.wav --device=auto`

For long files, Apollo supports chunked inference with overlap; this reduces memory pressure but should be auditioned for seam artifacts.

## Why Apollo first

Apollo directly addresses codec/compression restoration, including reconstruction of degraded high-frequency information. That makes it a much better first neural backend for the user's MP3 restoration goal than a speech-only denoiser or a stem separator.

It does **not** prove that a file's AI-generation fingerprint can be removed. Acoustic fingerprinting and embedded metadata/watermarks are separate problems. AMR will only claim signal improvement that is measured and audible.

## Next engine slots

- Neural restoration: Apollo (first backend)
- Neural stem separation: dedicated separator backend, not DSP masquerading as separation
- Optional learned denoise: separate enhancement backend
- Post-neural conservative DSP: de-shimmer / de-ess / peak safety / loudness
- Export: WAV 16/24-bit and real MP3 encoding at 128/192/256/320 kbps
