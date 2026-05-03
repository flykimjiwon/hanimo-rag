"""Tests for the recursive text chunker."""
from __future__ import annotations

import pytest

from hanimo_rag.core.chunker import chunk_text


class TestChunker:
    def test_empty_text(self) -> None:
        assert chunk_text("") == []
        assert chunk_text("   ") == []

    def test_short_text(self) -> None:
        text = "Hello world."
        chunks = chunk_text(text, chunk_size=100)
        assert len(chunks) == 1
        assert chunks[0].text == "Hello world."

    def test_splits_on_paragraphs(self) -> None:
        text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
        chunks = chunk_text(text, chunk_size=30, chunk_overlap=0)
        assert len(chunks) >= 2
        assert all(c.text for c in chunks)

    def test_splits_on_newlines(self) -> None:
        text = "Line one.\nLine two.\nLine three.\nLine four."
        chunks = chunk_text(text, chunk_size=25, chunk_overlap=0)
        assert len(chunks) >= 2

    def test_splits_on_sentences(self) -> None:
        text = "First sentence. Second sentence. Third sentence. Fourth sentence."
        chunks = chunk_text(text, chunk_size=35, chunk_overlap=0)
        assert len(chunks) >= 2

    def test_overlap(self) -> None:
        text = "AAAA.\n\nBBBB.\n\nCCCC.\n\nDDDD."
        chunks = chunk_text(text, chunk_size=10, chunk_overlap=3)
        # With overlap, later chunks should contain end of previous
        assert len(chunks) >= 2

    def test_chunk_indices_sequential(self) -> None:
        text = "A " * 500
        chunks = chunk_text(text, chunk_size=50, chunk_overlap=10)
        for i, c in enumerate(chunks):
            assert c.index == i

    def test_large_text_no_empty_chunks(self) -> None:
        text = "Word " * 1000
        chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
        assert all(c.text.strip() for c in chunks)

    def test_single_long_line(self) -> None:
        text = "x" * 2000
        chunks = chunk_text(text, chunk_size=500, chunk_overlap=0)
        assert len(chunks) >= 4
        assert all(len(c.text) <= 500 for c in chunks)

    def test_preserves_content(self) -> None:
        text = "Alpha\n\nBeta\n\nGamma"
        chunks = chunk_text(text, chunk_size=100, chunk_overlap=0)
        combined = " ".join(c.text for c in chunks)
        assert "Alpha" in combined
        assert "Beta" in combined
        assert "Gamma" in combined

    def test_custom_chunk_size(self) -> None:
        text = "Hello world. " * 100
        chunks_small = chunk_text(text, chunk_size=50, chunk_overlap=0)
        chunks_large = chunk_text(text, chunk_size=500, chunk_overlap=0)
        assert len(chunks_small) > len(chunks_large)
