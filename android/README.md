# AMR Android Client

This is the lightweight Android client for Audio Music Restoration. It hosts the web UI locally and sends neural-restoration jobs to the PC neural server when configured.

Target device: Android 7.1.2 (API 25) as a compatibility goal. The client itself does not run PyTorch/Apollo.

## Build

This directory is intentionally kept as a small native WebView client rather than a heavy framework wrapper. The final release APK must be built and tested on an Android build environment and on the target Redmi 5 Plus before being called release-ready.

## Neural architecture

Phone/browser UI -> HTTP neural server on PC -> Apollo/PyTorch -> restored WAV -> phone/browser -> export.

If the neural server is unavailable, local browser DSP remains available.
