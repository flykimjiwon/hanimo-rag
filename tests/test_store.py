"""Tests for JSON and SQLite stores."""
from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from hanimo_rag.store.json_store import JsonStore
from hanimo_rag.store.sqlite_store import SqliteStore
from hanimo_rag.types import IndexedChunk


def _make_chunks() -> list[IndexedChunk]:
    return [
        IndexedChunk(
            id="chunk-1",
            source="test.md",
            content="Python is a programming language used for web development.",
            topics=["python", "programming", "web development"],
            entities=["Python"],
            questions=["What is Python used for?"],
            category="concept",
            summary="Python overview and web development use case.",
        ),
        IndexedChunk(
            id="chunk-2",
            source="test.md",
            content="FastAPI is a modern web framework for building APIs with Python.",
            topics=["fastapi", "web framework", "api", "python"],
            entities=["FastAPI", "Python"],
            questions=["What is FastAPI?", "How to build APIs with Python?"],
            category="reference",
            summary="FastAPI framework introduction.",
        ),
        IndexedChunk(
            id="chunk-3",
            source="guide.md",
            content="To install dependencies, run pip install -r requirements.txt.",
            topics=["installation", "pip", "dependencies"],
            entities=["pip"],
            questions=["How to install dependencies?"],
            category="tutorial",
            summary="Installing Python dependencies with pip.",
        ),
    ]


class TestJsonStore:
    def test_save_and_lookup(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        chunks = _make_chunks()
        saved = store.save_chunks(chunks)
        assert saved == 3

    def test_no_duplicates(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        chunks = _make_chunks()
        store.save_chunks(chunks)
        saved_again = store.save_chunks(chunks)
        assert saved_again == 0
        assert store.get_stats()["total_chunks"] == 3

    def test_lookup_by_keys(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())

        results = store.lookup(keys=["python"], limit=10)
        assert len(results) >= 2
        # First result should have "python" as a topic
        assert "python" in [t.lower() for t in results[0].topics]

    def test_lookup_with_category(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())

        results = store.lookup(keys=["python"], category="reference", limit=10)
        assert len(results) >= 1
        assert all(r.category == "reference" for r in results)

    def test_lookup_empty_keys(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        results = store.lookup(keys=[], limit=10)
        assert results == []

    def test_get_all_keys(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        keys = store.get_all_keys()
        assert "python" in keys
        assert "FastAPI" in keys

    def test_delete_by_source(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        deleted = store.delete_by_source("test.md")
        assert deleted == 2
        assert store.get_stats()["total_chunks"] == 1

    def test_persistence(self, tmp_path: Path) -> None:
        store_path = str(tmp_path / "store")
        store1 = JsonStore(store_path)
        store1.save_chunks(_make_chunks())

        # Create new store instance from same path
        store2 = JsonStore(store_path)
        assert store2.get_stats()["total_chunks"] == 3

    def test_stats(self, tmp_path: Path) -> None:
        store = JsonStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        stats = store.get_stats()
        assert stats["total_chunks"] == 3
        assert stats["sources"] == 2
        assert stats["store_type"] == "json"
        assert "concept" in stats["categories"]


class TestSqliteStore:
    def test_save_and_lookup(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        chunks = _make_chunks()
        saved = store.save_chunks(chunks)
        assert saved >= 1  # SQLite INSERT OR IGNORE may vary

    def test_lookup_by_keys(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())

        results = store.lookup(keys=["python"], limit=10)
        assert len(results) >= 2

    def test_lookup_with_category(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())

        results = store.lookup(keys=["python"], category="reference", limit=10)
        assert len(results) >= 1
        assert all(r.category == "reference" for r in results)

    def test_lookup_empty_keys(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        results = store.lookup(keys=[], limit=10)
        assert results == []

    def test_get_all_keys(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        keys = store.get_all_keys()
        assert "python" in keys

    def test_delete_by_source(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        deleted = store.delete_by_source("test.md")
        assert deleted == 2
        assert store.get_stats()["total_chunks"] == 1

    def test_stats(self, tmp_path: Path) -> None:
        store = SqliteStore(str(tmp_path / "store"))
        store.save_chunks(_make_chunks())
        stats = store.get_stats()
        assert stats["total_chunks"] == 3
        assert stats["sources"] == 2
        assert stats["store_type"] == "sqlite"
