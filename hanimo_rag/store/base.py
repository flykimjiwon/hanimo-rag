"""Abstract base for storage backends."""
from __future__ import annotations

from abc import ABC, abstractmethod

from hanimo_rag.types import IndexedChunk


class StoreBase(ABC):
    """Base class for chunk storage."""

    @abstractmethod
    def save_chunks(self, chunks: list[IndexedChunk]) -> int:
        """Save chunks and return count saved."""
        ...

    @abstractmethod
    def lookup(
        self,
        keys: list[str],
        category: str | None = None,
        limit: int = 20,
    ) -> list[IndexedChunk]:
        """Look up chunks by keyword matching on topics/entities/questions."""
        ...

    @abstractmethod
    def get_all_keys(self) -> set[str]:
        """Return all unique keys (topics + entities) in the store."""
        ...

    @abstractmethod
    def get_stats(self) -> dict:
        """Return store statistics."""
        ...

    @abstractmethod
    def delete_by_source(self, source: str) -> int:
        """Delete all chunks from a given source. Return count deleted."""
        ...
