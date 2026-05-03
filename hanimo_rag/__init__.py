"""HanimoRAG v2 — Agentic LiteRAG engine.

3-line usage:
    rag = HanimoRAG(model="qwen2.5:7b")
    await rag.index("./docs/")
    answer = await rag.ask("How do I configure the database?")
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from hanimo_rag.config import Config
from hanimo_rag.core.agent import AgenticSearch
from hanimo_rag.core.indexer import Indexer
from hanimo_rag.llm import create_llm
from hanimo_rag.parsers import parse_file
from hanimo_rag.store import create_store

__version__ = "2.0.0"


class HanimoRAG:
    """3-line RAG: init -> index -> ask."""

    def __init__(
        self,
        model: str = "qwen2.5:7b",
        store_path: str = "./hanimo_rag_data",
        store_type: str = "json",
        **llm_kwargs: object,
    ) -> None:
        self.config = Config(
            model=model,
            store_path=store_path,
            store_type=store_type,
            **{k: v for k, v in llm_kwargs.items() if hasattr(Config, k)},  # type-safe forwarding
        )
        self.llm = create_llm(self.config)
        self.store = create_store(self.config)
        self.indexer = Indexer(self.llm, self.store)
        self.search_engine = AgenticSearch(self.llm, self.store)

    async def index(
        self,
        path: str,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
    ) -> dict:
        """Index a file or directory."""
        p = Path(path)
        results: list[dict] = []

        if p.is_dir():
            files = sorted(f for f in p.rglob("*") if f.is_file() and not f.name.startswith("."))
        else:
            files = [p]

        for f in files:
            result = await self.indexer.index_file(
                str(f),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )
            results.append(result)

        return {"indexed": len(results), "files": results}

    async def search(
        self,
        query: str,
        top_k: int = 5,
        max_rounds: int = 3,
    ) -> list[dict]:
        """Agentic search with LLM routing."""
        return await self.search_engine.search(query, top_k=top_k, max_rounds=max_rounds)

    async def ask(self, question: str, top_k: int = 5) -> str:
        """Search + generate answer."""
        results = await self.search(question, top_k=top_k)
        if not results:
            return "No relevant information found."

        context = "\n\n---\n\n".join(r["content"] for r in results)
        prompt = (
            f"Based on the following context, answer the question.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Answer:"
        )
        return await self.llm.generate(prompt)

    # ── Sync wrappers ──────────────────────────────────────────────

    def index_sync(self, path: str, **kwargs: object) -> dict:
        """Synchronous wrapper for index()."""
        return asyncio.run(self.index(path, **kwargs))

    def search_sync(self, query: str, **kwargs: object) -> list[dict]:
        """Synchronous wrapper for search()."""
        return asyncio.run(self.search(query, **kwargs))

    def ask_sync(self, question: str, **kwargs: object) -> str:
        """Synchronous wrapper for ask()."""
        return asyncio.run(self.ask(question, **kwargs))


__all__ = ["HanimoRAG", "Config", "parse_file", "__version__"]
