# AMR Shared Contract

This directory is the single source of truth for client/server behavior.

- `amr-config.json` — shared feature and output contract.
- Android and browser clients should consume the same schema.
- Neural processing remains server-side; the client must never label a DSP fallback as neural.
- Original audio is immutable; processing always creates a new working/output file.

## Synchronization model

1. GitHub repository version identifies the application build.
2. Browser loads the shared configuration at runtime.
3. Android bundles the same configuration into the APK at build time.
4. Neural server exposes `/health` and `/restore` and reports its engine/model status.
5. A client may use local DSP without the neural server; Neural Restore requires a healthy neural backend.
6. Future update checks can compare the bundled app version with the repository/release version.

## Output contract

WAV 16-bit and 24-bit are local output targets. MP3 128/192/256/320 kbps must use a real MP3 encoder; never rename WAV data to `.mp3`.

## Fingerprint wording

Metadata stripping is distinct from acoustic fingerprinting. AMR may remove container tags from newly rendered output, but it does not claim guaranteed removal of proprietary acoustic fingerprints or embedded watermarks.