"""Neural restoration adapter used by the AMR local server.

The browser must never label ordinary DSP as neural inference. This adapter
exposes Apollo as the real restoration backend when the upstream Apollo
checkout is installed beside this project.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from apollo_engine import ApolloConfig, ApolloEngine

@dataclass
class ModelInfo:
    name: str
    version: str
    runtime: str

class NeuralRestorationAdapter:
    def __init__(self, engine: Optional[ApolloEngine] = None):
        self.engine = engine or ApolloEngine(ApolloConfig())

    @property
    def info(self) -> ModelInfo:
        s = self.engine.status()
        return ModelInfo(s["model"], s["model"], s["runtime"])

    def available(self) -> bool:
        return self.engine.available()

    def process(self, input_wav: Path, output_wav: Path, strength: float = 0.5) -> ModelInfo:
        # Apollo is a reconstruction model; strength is intentionally not
        # mapped to a fake gain/EQ control. The UI should blend its result with
        # the source if a user wants conservative restoration.
        self.engine.restore(input_wav, output_wav)
        return self.info
