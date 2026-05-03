"""OpenAI-compatible LLM provider."""
from __future__ import annotations

import httpx

from hanimo_rag.config import Config
from hanimo_rag.llm.base import LLMBase


class OpenAICompatLLM(LLMBase):
    """Works with OpenAI, Together, Groq, or any OpenAI-compatible endpoint."""

    def __init__(self, config: Config) -> None:
        self.model = config.model_name
        self.base_url = config.openai_base_url.rstrip("/")
        self.api_key = config.openai_api_key
        self.temperature = config.temperature
        self.max_tokens = config.max_tokens

        if not self.api_key:
            raise ValueError(
                "OpenAI API key is required. Set OPENAI_API_KEY env var "
                "or pass openai_api_key to Config."
            )

    async def generate(self, prompt: str, system: str = "") -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices", [])
        if not choices:
            return ""
        return choices[0].get("message", {}).get("content", "")
