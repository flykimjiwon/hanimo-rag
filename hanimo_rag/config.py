"""Configuration for HanimoRAG."""
from __future__ import annotations

import os
from dataclasses import dataclass, field

_KNOWN_PROVIDERS = {"ollama", "openai"}


@dataclass
class Config:
    """HanimoRAG configuration.

    Model string format:
        - "qwen2.5:7b"              -> provider=ollama, model=qwen2.5:7b
        - "ollama:qwen2.5:7b"       -> provider=ollama, model=qwen2.5:7b
        - "openai:gpt-4o-mini"      -> provider=openai, model=gpt-4o-mini
    """

    model: str = "qwen2.5:7b"
    store_path: str = "./hanimo_rag_data"
    store_type: str = "json"  # "json" or "sqlite"

    # LLM settings
    llm_provider: str = ""
    ollama_base_url: str = "http://localhost:11434"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    temperature: float = 0.1
    max_tokens: int = 2048

    # Parsed after init
    _resolved_provider: str = field(default="", init=False, repr=False)
    _resolved_model: str = field(default="", init=False, repr=False)

    def __post_init__(self) -> None:
        self._parse_model_string()
        # Pick up env vars as fallbacks
        if not self.openai_api_key:
            self.openai_api_key = os.environ.get("OPENAI_API_KEY", "")
        if not self.ollama_base_url or self.ollama_base_url == "http://localhost:11434":
            self.ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

    def _parse_model_string(self) -> None:
        """Parse 'provider:model' or just 'model'."""
        if self.llm_provider:
            self._resolved_provider = self.llm_provider
            self._resolved_model = self.model
            return

        parts = self.model.split(":", 1)
        if len(parts) == 2 and parts[0].lower() in _KNOWN_PROVIDERS:
            self._resolved_provider = parts[0].lower()
            self._resolved_model = parts[1]
        else:
            # Default to ollama for unknown provider prefixes
            self._resolved_provider = "ollama"
            self._resolved_model = self.model

    @property
    def provider(self) -> str:
        return self._resolved_provider

    @property
    def model_name(self) -> str:
        return self._resolved_model
