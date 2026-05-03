"""Shared types for HanimoRAG."""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field


@dataclass
class IndexedChunk:
    """A chunk of text with LLM-extracted search keys."""

    id: str
    source: str
    content: str
    topics: list[str] = field(default_factory=list)
    entities: list[str] = field(default_factory=list)
    questions: list[str] = field(default_factory=list)
    category: str = "other"
    summary: str = ""
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source": self.source,
            "content": self.content,
            "topics": self.topics,
            "entities": self.entities,
            "questions": self.questions,
            "category": self.category,
            "summary": self.summary,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> IndexedChunk:
        return cls(
            id=data["id"],
            source=data["source"],
            content=data["content"],
            topics=data.get("topics", []),
            entities=data.get("entities", []),
            questions=data.get("questions", []),
            category=data.get("category", "other"),
            summary=data.get("summary", ""),
            created_at=data.get("created_at", time.time()),
        )

    @staticmethod
    def make_id(source: str, content: str) -> str:
        """Generate a deterministic chunk ID."""
        raw = f"{source}::{content[:200]}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
