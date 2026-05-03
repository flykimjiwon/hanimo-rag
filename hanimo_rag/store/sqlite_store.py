"""SQLite storage backend for larger datasets."""
from __future__ import annotations

import json
import logging
import sqlite3
from pathlib import Path

from hanimo_rag.store.base import StoreBase
from hanimo_rag.types import IndexedChunk

logger = logging.getLogger(__name__)

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    topics_json TEXT NOT NULL DEFAULT '[]',
    entities_json TEXT NOT NULL DEFAULT '[]',
    questions_json TEXT NOT NULL DEFAULT '[]',
    category TEXT NOT NULL DEFAULT 'other',
    summary TEXT NOT NULL DEFAULT '',
    created_at REAL NOT NULL
)
"""

_CREATE_INDEX_CATEGORY = """
CREATE INDEX IF NOT EXISTS idx_chunks_category ON chunks(category)
"""

_CREATE_INDEX_SOURCE = """
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source)
"""


class SqliteStore(StoreBase):
    """SQLite-backed store. Handles large datasets efficiently."""

    def __init__(self, store_path: str) -> None:
        self.store_dir = Path(store_path)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.store_dir / "index.db"
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(_CREATE_TABLE)
            conn.execute(_CREATE_INDEX_CATEGORY)
            conn.execute(_CREATE_INDEX_SOURCE)
            conn.commit()

    def save_chunks(self, chunks: list[IndexedChunk]) -> int:
        added = 0
        with self._connect() as conn:
            for chunk in chunks:
                try:
                    conn.execute(
                        """INSERT OR IGNORE INTO chunks
                           (id, source, content, topics_json, entities_json,
                            questions_json, category, summary, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            chunk.id,
                            chunk.source,
                            chunk.content,
                            json.dumps(chunk.topics, ensure_ascii=False),
                            json.dumps(chunk.entities, ensure_ascii=False),
                            json.dumps(chunk.questions, ensure_ascii=False),
                            chunk.category,
                            chunk.summary,
                            chunk.created_at,
                        ),
                    )
                    if conn.total_changes:
                        added += 1
                except sqlite3.IntegrityError:
                    pass
            conn.commit()
        return added

    def lookup(
        self,
        keys: list[str],
        category: str | None = None,
        limit: int = 20,
    ) -> list[IndexedChunk]:
        if not keys:
            return []

        with self._connect() as conn:
            # Build WHERE clause with LIKE for each key across topics/entities/questions
            conditions: list[str] = []
            params: list[str] = []

            if category:
                conditions.append("category = ?")
                params.append(category)

            key_conditions: list[str] = []
            for key in keys:
                pattern = f"%{key}%"
                key_conditions.append(
                    "(LOWER(topics_json) LIKE LOWER(?) "
                    "OR LOWER(entities_json) LIKE LOWER(?) "
                    "OR LOWER(questions_json) LIKE LOWER(?) "
                    "OR LOWER(summary) LIKE LOWER(?))"
                )
                params.extend([pattern, pattern, pattern, pattern])

            if key_conditions:
                conditions.append(f"({' OR '.join(key_conditions)})")

            where = " AND ".join(conditions) if conditions else "1=1"
            query = f"SELECT * FROM chunks WHERE {where} LIMIT ?"
            params.append(str(limit * 3))  # Fetch more for scoring

            rows = conn.execute(query, params).fetchall()

        # Convert and score
        chunks_with_scores: list[tuple[float, IndexedChunk]] = []
        lower_keys = [k.lower() for k in keys]

        for row in rows:
            chunk = _row_to_chunk(row)
            score = _score_chunk(chunk, lower_keys)
            chunks_with_scores.append((score, chunk))

        chunks_with_scores.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in chunks_with_scores[:limit]]

    def get_all_keys(self) -> set[str]:
        keys: set[str] = set()
        with self._connect() as conn:
            rows = conn.execute("SELECT topics_json, entities_json FROM chunks").fetchall()
            for row in rows:
                topics = json.loads(row["topics_json"])
                entities = json.loads(row["entities_json"])
                keys.update(topics)
                keys.update(entities)
        return keys

    def get_stats(self) -> dict:
        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(*) as cnt FROM chunks").fetchone()["cnt"]
            sources = conn.execute("SELECT COUNT(DISTINCT source) as cnt FROM chunks").fetchone()["cnt"]
            cat_rows = conn.execute(
                "SELECT category, COUNT(*) as cnt FROM chunks GROUP BY category"
            ).fetchall()
            categories = {r["category"]: r["cnt"] for r in cat_rows}

        return {
            "total_chunks": total,
            "sources": sources,
            "categories": categories,
            "store_type": "sqlite",
            "store_path": str(self.store_dir),
        }

    def delete_by_source(self, source: str) -> int:
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM chunks WHERE source = ?", (source,))
            conn.commit()
            return cursor.rowcount


def _row_to_chunk(row: sqlite3.Row) -> IndexedChunk:
    return IndexedChunk(
        id=row["id"],
        source=row["source"],
        content=row["content"],
        topics=json.loads(row["topics_json"]),
        entities=json.loads(row["entities_json"]),
        questions=json.loads(row["questions_json"]),
        category=row["category"],
        summary=row["summary"],
        created_at=row["created_at"],
    )


def _score_chunk(chunk: IndexedChunk, lower_keys: list[str]) -> float:
    """Score a chunk by keyword overlap."""
    score = 0.0
    chunk_topics = [t.lower() for t in chunk.topics]
    chunk_entities = [e.lower() for e in chunk.entities]
    chunk_questions = " ".join(chunk.questions).lower()

    for key in lower_keys:
        if key in chunk_topics:
            score += 3.0
        elif any(key in t or t in key for t in chunk_topics):
            score += 1.5
        if key in chunk_entities:
            score += 2.5
        elif any(key in e or e in key for e in chunk_entities):
            score += 1.0
        if key in chunk_questions:
            score += 1.0
        if key in chunk.summary.lower():
            score += 0.5

    return score
