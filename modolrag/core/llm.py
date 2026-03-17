from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncGenerator

import httpx

from modolrag.config import Settings


class LLMBase(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str = "") -> str: ...

    @abstractmethod
    async def generate_stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]: ...


class OllamaLLM(LLMBase):
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def generate(self, prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
                },
            )
            resp.raise_for_status()
            return resp.json().get("message", {}).get("content", "")

    async def generate_stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": True,
                    "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    import json

                    try:
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if data.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue


class OpenAILLM(LLMBase):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", temperature: float = 0.1, max_tokens: int = 2048):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def generate(self, prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def generate_stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stream": True,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:]
                    if payload == "[DONE]":
                        break
                    import json

                    try:
                        data = json.loads(payload)
                        delta = data["choices"][0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue


def get_llm(settings: Settings | None = None, **overrides) -> LLMBase:
    if settings is None:
        from modolrag.config import get_settings

        settings = get_settings()

    provider = overrides.get("provider", settings.LLM_PROVIDER)
    model = overrides.get("model", settings.LLM_MODEL)
    temperature = overrides.get("temperature", settings.LLM_TEMPERATURE)
    max_tokens = overrides.get("max_tokens", settings.LLM_MAX_TOKENS)

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY required for openai LLM provider")
        return OpenAILLM(api_key=settings.OPENAI_API_KEY, model=model, temperature=temperature, max_tokens=max_tokens)
    return OllamaLLM(base_url=settings.OLLAMA_BASE_URL, model=model, temperature=temperature, max_tokens=max_tokens)
