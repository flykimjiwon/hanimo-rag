"""LLM-based relevance judge for search results."""
from __future__ import annotations

import logging

from hanimo_rag.llm.base import LLMBase
from hanimo_rag.types import IndexedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a relevance judge. Rate whether each chunk is relevant to a search query. "
    "Always output valid JSON."
)

JUDGE_PROMPT = """Query: {query}

Rate each chunk's relevance to the query. Be strict — only mark as relevant if the chunk
actually helps answer or address the query.

{chunks_formatted}

Output JSON array only:
[{{"id": "chunk_id", "relevant": true}}, {{"id": "chunk_id", "relevant": false}}, ...]"""


class Judge:
    """Filter search results by LLM-judged relevance."""

    def __init__(self, llm: LLMBase) -> None:
        self.llm = llm

    async def filter(
        self,
        query: str,
        chunks: list[IndexedChunk],
        batch_size: int = 10,
    ) -> list[IndexedChunk]:
        """Filter chunks to only those relevant to the query."""
        if not chunks:
            return []

        relevant: list[IndexedChunk] = []
        chunk_map = {c.id: c for c in chunks}

        # Process in batches
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            batch_relevant = await self._judge_batch(query, batch, chunk_map)
            relevant.extend(batch_relevant)

        return relevant

    async def _judge_batch(
        self,
        query: str,
        batch: list[IndexedChunk],
        chunk_map: dict[str, IndexedChunk],
    ) -> list[IndexedChunk]:
        """Judge a batch of chunks."""
        chunks_formatted = "\n\n".join(
            f"Chunk ID: {c.id}\n"
            f"Summary: {c.summary}\n"
            f"Content preview: {c.content[:300]}"
            for c in batch
        )

        prompt = JUDGE_PROMPT.format(query=query, chunks_formatted=chunks_formatted)
        result = await self.llm.generate_json(prompt, system=SYSTEM_PROMPT)

        relevant: list[IndexedChunk] = []

        # Handle both direct list and dict with "items" key
        judgments: list[dict] = []
        if isinstance(result, dict):
            judgments = result.get("items", [])
            if not judgments:
                # Maybe the result itself has the expected keys
                # This happens when generate_json wraps a list
                for key in result:
                    if isinstance(result[key], list):
                        judgments = result[key]
                        break
        elif isinstance(result, list):
            judgments = result

        if not judgments:
            # Fallback: if LLM failed, return all chunks (be permissive)
            logger.warning("Judge failed to parse results; returning all chunks as relevant")
            return list(batch)

        for j in judgments:
            if not isinstance(j, dict):
                continue
            chunk_id = j.get("id", "")
            is_relevant = j.get("relevant", False)
            if is_relevant and chunk_id in chunk_map:
                relevant.append(chunk_map[chunk_id])

        return relevant
