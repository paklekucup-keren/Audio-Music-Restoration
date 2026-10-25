"""Real-model adapter boundary.

Replace `process()` with a tested neural audio enhancement model. Keeping this
interface separate prevents the browser/DSP layer from pretending that DSP is
neural inference.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path

@dataclass
class ModelInfo:
    name: str
    version: str
    runtime: str

class NeuralRestorationAdapter:
    info = ModelInfo("UNCONFIGURED", "0", "none")

    def available(self) -> bool:
        return False

    def process(self, input_wav: Path, output_wav: Path, strength: float = 0.5) -> ModelInfo:
        raise RuntimeError(
            "No neural model is installed. Configure a tested model adapter "
            "before enabling Neural Restoration."
        )
