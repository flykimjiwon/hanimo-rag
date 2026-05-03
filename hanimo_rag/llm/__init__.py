"""LLM providers for HanimoRAG."""
from __future__ import annotations

from hanimo_rag.config import Config
from hanimo_rag.llm.base import LLMBase


def create_llm(config: Config) -> LLMBase:
    """Factory: create an LLM client from config."""
    provider = config.provider

    if provider == "ollama":
        from hanimo_rag.llm.ollama import OllamaLLM
        return OllamaLLM(config)
    elif provider == "openai":
        from hanimo_rag.llm.openai_compat import OpenAICompatLLM
        return OpenAICompatLLM(config)
    else:
        raise ValueError(f"Unknown LLM provider: {provider!r}. Use 'ollama' or 'openai'.")
