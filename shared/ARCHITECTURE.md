# AMR Shared Architecture Contract

Audio Music Restoration uses one product workflow with multiple clients.

## Clients

- Android APK: lightweight WebView client, minimum API 25.
- Desktop/browser client: same `index.html` workflow.
- Neural host: separate PC/server process; the client does not embed PyTorch/Apollo.

## Synchronization rule

UI behavior, restoration presets, output choices and server contract are defined centrally by the repository. Clients consume the same contract rather than maintaining separate feature implementations.

## Neural flow

`Client -> HTTP /health -> HTTP /restore -> Neural host -> restored WAV -> client -> A/B -> PRO MASTER -> export`

If the neural host is unavailable, the client must clearly report that state and must not silently substitute DSP while labeling the result as neural.

## Compatibility

The Android client targets API 25 for Redmi 5 Plus / Android 7.1.2. Heavy neural inference is intentionally server-side. The legacy Windows 7 32-bit machine is not assumed to be a compatible PyTorch neural host.

## Versioning

`shared/amr-config.json` is the source-of-truth contract for product version, neural endpoint defaults, output choices and restoration targets. Any client update should preserve backward-compatible fields where possible.
