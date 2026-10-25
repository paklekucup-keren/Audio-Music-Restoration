# Neural Audio Engine

This directory defines the real neural-processing integration boundary for Audio Music Restoration.

## Architecture

`Browser UI -> local PC Neural Server -> neural model runtime -> WAV/PCM result -> Browser UI -> export`

The browser remains lightweight. Android 7.1.2 is a client, not the neural inference machine.

## Model contract

The server accepts PCM/WAV input and returns processed WAV/PCM. A model adapter must explicitly report:

- model name/version
- runtime/backend
- sample-rate support
- channel support
- processing duration
- input/output peak and RMS
- whether the operation was restoration or separation

## Required restoration targets

The neural pipeline is intended to address, where the selected model actually supports them:

- shimmer / unstable high-frequency texture
- metallic high-frequency character
- grainy/digital texture
- artificial vocal texture
- codec damage
- high-frequency artifacts
- missing/softened restoration detail

The application must not label a DSP filter as neural restoration.

## Fingerprint / metadata

Container metadata can be stripped from newly rendered output. Acoustic fingerprinting is signal-derived and is not equivalent to metadata. The product therefore exposes a fingerprint inspector and does not promise removal of proprietary fingerprinting or watermarking. Any future signal transformation must be described accurately and must not claim guaranteed identity evasion.

## Runtime

`server.py` is the integration scaffold for a local PC service. A real model adapter belongs in `model_adapter.py`. The adapter is deliberately isolated so that a compatible open-source neural enhancement model can be installed without changing the browser UI.
