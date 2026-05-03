"""JSON file-based storage backend."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from hanimo_rag.store.base import StoreBase
from hanimo_rag.types import IndexedChunk

logger = logging.getLogger(__name__)


class JsonStore(StoreBase):
    """Simple JSON file store. Good for <100k chunks."""

    def __init__(self, store_path: str) -> None:
        self.store_dir = Path(store_path)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.store_dir / "index.json"
        self._chunks: list[IndexedChunk] = []
        self._load()

    def _load(self) -> None:
        if self.index_file.exists():
            try:
                data = json.loads(self.index_file.read_text(encoding="utf-8"))
                self._chunks = [IndexedChunk.from_dict(d) for d in data]
                logger.info("Loaded %d chunks from %s", len(self._chunks), self.index_file)
            except (json.JSONDecodeError, KeyError) as exc:
                logger.warning("Failed to load index: %s — starting fresh", exc)
                self._chunks = []
        else:
            self._chunks = []

    def _save(self) -> None:
        data = [c.to_dict() for c in self._chunks]
        self.index_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def save_chunks(self, chunks: list[IndexedChunk]) -> int:
        existing_ids = {c.id for c in self._chunks}
        added = 0
        for chunk in chunks:
            if chunk.id not in existing_ids:
                self._chunks.append(chunk)
                existing_ids.add(chunk.id)
                added += 1
        self._save()
        return added

    def lookup(
        self,
        keys: list[str],
        category: str | None = None,
        limit: int = 20,
    ) -> list[IndexedChunk]:
        if not keys:
            return []

        lower_keys = [k.lower() for k in keys]
        scored: list[tuple[float, IndexedChunk]] = []

        for chunk in self._chunks:
            if category and chunk.category != category:
                continue

            score = _score_chunk(chunk, lower_keys)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored[:limit]]

    def get_all_keys(self) -> set[str]:
        keys: set[str] = set()
        for chunk in self._chunks:
            keys.update(chunk.topics)
            keys.update(chunk.entities)
        return keys

    def get_stats(self) -> dict:
        sources = {c.source for c in self._chunks}
        categories: dict[str, int] = {}
        for c in self._chunks:
            categories[c.category] = categories.get(c.category, 0) + 1
        return {
            "total_chunks": len(self._chunks),
            "sources": len(sources),
            "categories": categories,
            "store_type": "json",
            "store_path": str(self.store_dir),
        }

    def delete_by_source(self, source: str) -> int:
        before = len(self._chunks)
        self._chunks = [c for c in self._chunks if c.source != source]
        deleted = before - len(self._chunks)
        if deleted > 0:
            self._save()
        return deleted


def _score_chunk(chunk: IndexedChunk, lower_keys: list[str]) -> float:
    """Score a chunk by keyword overlap with topics, entities, and questions."""
    score = 0.0

    chunk_topics = [t.lower() for t in chunk.topics]
    chunk_entities = [e.lower() for e in chunk.entities]
    chunk_questions = " ".join(chunk.questions).lower()

    for key in lower_keys:
        # Exact match in topics (highest weight)
        if key in chunk_topics:
            score += 3.0
        # Partial match in topics
        elif any(key in t or t in key for t in chunk_topics):
            score += 1.5

        # Exact match in entities
        if key in chunk_entities:
            score += 2.5
        # Partial match in entities
        elif any(key in e or e in key for e in chunk_entities):
            score += 1.0

        # Match in questions
        if key in chunk_questions:
            score += 1.0

        # Match in summary (lowest weight)
        if key in chunk.summary.lower():
            score += 0.5

    return score
