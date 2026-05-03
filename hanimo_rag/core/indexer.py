"""LLM-based document indexer — the core innovation of HanimoRAG."""
from __future__ import annotations

import logging
from pathlib import Path

from hanimo_rag.core.chunker import chunk_text
from hanimo_rag.llm.base import LLMBase
from hanimo_rag.parsers import parse_file
from hanimo_rag.store.base import StoreBase
from hanimo_rag.types import IndexedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a document indexer. Extract structured metadata from text chunks "
    "for search indexing. Always output valid JSON."
)

EXTRACT_PROMPT = """Analyze this text and extract metadata for search indexing.

<text>
{text}
</text>

Output JSON only:
{{
  "topics": ["keyword1", "keyword2", ...],
  "entities": ["Entity1", "Entity2", ...],
  "questions": ["question this text answers", ...],
  "category": "tutorial|reference|api|concept|troubleshooting|config|example|discussion|news|other",
  "summary": "one sentence summary"
}}"""


class Indexer:
    """Index documents by extracting LLM-generated metadata for each chunk."""

    def __init__(self, llm: LLMBase, store: StoreBase) -> None:
        self.llm = llm
        self.store = store

    async def index_file(
        self,
        file_path: str,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
    ) -> dict:
        """Parse and index a file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        doc = parse_file(file_path)
        if not doc.text.strip():
            logger.warning("Empty document: %s", file_path)
            return {"source": file_path, "chunks": 0, "status": "empty"}

        return await self.index_text(
            doc.text,
            source=file_path,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    async def index_text(
        self,
        text: str,
        source: str = "manual",
        chunk_size: int = 512,
        chunk_overlap: int = 50,
    ) -> dict:
        """Index raw text by chunking and extracting metadata."""
        text_chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        if not text_chunks:
            return {"source": source, "chunks": 0, "status": "empty"}

        indexed_chunks: list[IndexedChunk] = []
        errors = 0

        for tc in text_chunks:
            try:
                metadata = await self._extract_metadata(tc.text)
                chunk_id = IndexedChunk.make_id(source, tc.text)

                indexed_chunks.append(
                    IndexedChunk(
                        id=chunk_id,
                        source=source,
                        content=tc.text,
                        topics=metadata.get("topics", []),
                        entities=metadata.get("entities", []),
                        questions=metadata.get("questions", []),
                        category=metadata.get("category", "other"),
                        summary=metadata.get("summary", ""),
                    )
                )
            except Exception as exc:
                logger.error("Failed to extract metadata for chunk %d: %s", tc.index, exc)
                errors += 1
                # Still save the chunk with minimal metadata
                chunk_id = IndexedChunk.make_id(source, tc.text)
                indexed_chunks.append(
                    IndexedChunk(
                        id=chunk_id,
                        source=source,
                        content=tc.text,
                    )
                )

        saved = self.store.save_chunks(indexed_chunks)

        return {
            "source": source,
            "chunks": len(indexed_chunks),
            "saved": saved,
            "errors": errors,
            "status": "ok",
        }

    async def _extract_metadata(self, text: str) -> dict:
        """Use LLM to extract structured metadata from a text chunk."""
        prompt = EXTRACT_PROMPT.format(text=text[:2000])  # Truncate very long chunks
        result = await self.llm.generate_json(prompt, system=SYSTEM_PROMPT)

        # Validate and normalize
        return {
            "topics": _ensure_str_list(result.get("topics", [])),
            "entities": _ensure_str_list(result.get("entities", [])),
            "questions": _ensure_str_list(result.get("questions", [])),
            "category": str(result.get("category", "other")),
            "summary": str(result.get("summary", "")),
        }


def _ensure_str_list(value: object) -> list[str]:
    """Ensure a value is a list of strings."""
    if isinstance(value, list):
        return [str(v) for v in value if v]
    if isinstance(value, str):
        return [value]
    return []
