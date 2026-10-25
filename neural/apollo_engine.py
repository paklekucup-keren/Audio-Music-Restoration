"""Apollo neural music-restoration bridge.

This adapter invokes the genuine upstream Apollo inference implementation rather
than replacing it with DSP. Apollo is designed for restoration of lossy MP3 /
compressed music and reconstructs degraded mid/high-frequency content.

The bridge deliberately keeps the upstream model outside this repository so its
original code, checkpoint and license remain attributable to their authors.
"""
from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class ApolloConfig:
    repo_dir: Path = Path(os.environ.get("AMR_APOLLO_DIR", "../third_party/Apollo"))
    python_exe: str = os.environ.get("AMR_APOLLO_PYTHON", "python")
    inference_script: str = "inference.py"
    device: str = os.environ.get("AMR_APOLLO_DEVICE", "auto")
    timeout_seconds: int = int(os.environ.get("AMR_APOLLO_TIMEOUT", "3600"))


class ApolloEngine:
    """Small process-isolated adapter around Apollo inference."""

    name = "Apollo"
    version = "upstream"
    runtime = "PyTorch"

    def __init__(self, config: Optional[ApolloConfig] = None):
        self.config = config or ApolloConfig()

    @property
    def repo_dir(self) -> Path:
        return self.config.repo_dir.resolve()

    def available(self) -> bool:
        return (self.repo_dir / self.config.inference_script).is_file()

    def status(self) -> dict:
        return {
            "available": self.available(),
            "model": self.name if self.available() else "UNCONFIGURED",
            "repo_dir": str(self.repo_dir),
            "runtime": self.runtime,
        }

    def restore(self, input_wav: Path, output_wav: Path,
                chunk_seconds: Optional[float] = None,
                overlap_seconds: Optional[float] = None) -> None:
        if not self.available():
            raise RuntimeError(
                "Apollo is not installed. Put the upstream Apollo repository in "
                f"{self.repo_dir} or set AMR_APOLLO_DIR."
            )

        cmd = [
            self.config.python_exe,
            self.config.inference_script,
            f"--in_wav={str(input_wav.resolve())}",
            f"--out_wav={str(output_wav.resolve())}
",
            f"--device={self.config.device}",
        ]
        if chunk_seconds is not None:
            cmd.append(f"--chunk-seconds={chunk_seconds}")
        if overlap_seconds is not None:
            cmd.append(f"--overlap-seconds={overlap_seconds}")

        proc = subprocess.run(
            cmd,
            cwd=str(self.repo_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            timeout=self.config.timeout_seconds,
        )
        if proc.returncode != 0:
            raise RuntimeError("Apollo inference failed:\n" + proc.stdout[-12000:])
        if not output_wav.is_file() or output_wav.stat().st_size < 44:
            raise RuntimeError("Apollo finished without producing a valid WAV output.")
