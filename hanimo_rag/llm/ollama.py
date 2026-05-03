"""Ollama LLM provider."""
from __future__ import annotations

import httpx

from hanimo_rag.config import Config
from hanimo_rag.llm.base import LLMBase


class OllamaLLM(LLMBase):
    """Ollama local LLM via HTTP API."""

    def __init__(self, config: Config) -> None:
        self.model = config.model_name
        self.base_url = config.ollama_base_url.rstrip("/")
        self.temperature = config.temperature
        self.max_tokens = config.max_tokens

    async def generate(self, prompt: str, system: str = "") -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            resp = await client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()

        return data.get("message", {}).get("content", "")
